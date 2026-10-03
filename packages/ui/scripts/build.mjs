import { existsSync } from "node:fs"
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import postcss from "postcss"
import tailwindcss from "@tailwindcss/postcss"

const root = fileURLToPath(new URL("../", import.meta.url))
const source = path.join(root, "src")
const output = path.join(root, "dist")
const config = ts.readConfigFile(
  path.join(root, "tsconfig.json"),
  ts.sys.readFile
)
if (config.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(config.error.messageText, "\n")
  )
const parsed = ts.parseJsonConfigFileContent(
  { ...config.config, include: ["src/**/*.ts", "src/**/*.tsx"] },
  ts.sys,
  root,
  {
    noEmit: false,
    rootDir: source,
    outDir: output,
    declaration: true,
    declarationMap: false,
    sourceMap: false,
  }
)
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
if (diagnostics.length) {
  throw new Error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    })
  )
}

// Emit modules individually to preserve React Server Component boundaries.
// Explicit extensions also make the published ESM usable by Node.js.
function resolveImports(context) {
  return (file) => {
    function visit(node) {
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      ) {
        const specifier = node.argument.literal.text
        if (specifier.startsWith(".")) {
          const target = path.resolve(path.dirname(file.fileName), specifier)
          if (
            [".ts", ".tsx"].some((extension) => existsSync(target + extension))
          ) {
            return context.factory.updateImportTypeNode(
              node,
              context.factory.createLiteralTypeNode(
                context.factory.createStringLiteral(specifier + ".js")
              ),
              node.attributes,
              node.qualifier,
              node.typeArguments,
              node.isTypeOf
            )
          }
        }
      }
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const specifier = node.moduleSpecifier.text
        if (specifier.startsWith(".")) {
          const target = path.resolve(path.dirname(file.fileName), specifier)
          const suffix = [".ts", ".tsx"].find((extension) =>
            existsSync(target + extension)
          )
          const index =
            !suffix &&
            [".ts", ".tsx"].find((extension) =>
              existsSync(path.join(target, "index" + extension))
            )
          if (suffix || index) {
            const rewritten = context.factory.createStringLiteral(
              specifier + (suffix ? ".js" : "/index.js")
            )
            return ts.isImportDeclaration(node)
              ? context.factory.updateImportDeclaration(
                  node,
                  node.modifiers,
                  node.importClause,
                  rewritten,
                  node.attributes
                )
              : context.factory.updateExportDeclaration(
                  node,
                  node.modifiers,
                  node.isTypeOnly,
                  node.exportClause,
                  rewritten,
                  node.attributes
                )
          }
        }
      }
      return ts.visitEachChild(node, visit, context)
    }
    return ts.visitNode(file, visit)
  }
}

// Compile styles using only package sources, independent of the consumer's scanner.
const stylesheet = path.join(source, "styles/globals.css")
const styles = await postcss([
  tailwindcss({ base: source, optimize: true }),
]).process(await readFile(stylesheet, "utf8"), {
  from: stylesheet,
  to: path.join(output, "styles/globals.css"),
  map: false,
})
if (output !== path.join(root, "dist")) throw new Error("Invalid build output")
await rm(output, { recursive: true, force: true })
const result = program.emit(undefined, undefined, undefined, false, {
  before: [resolveImports],
  afterDeclarations: [resolveImports],
})
if (result.emitSkipped || result.diagnostics.length)
  throw new Error("TypeScript emit failed")
await mkdir(path.join(output, "styles"), { recursive: true })
await writeFile(path.join(output, "styles/globals.css"), styles.css)
// KaTeX's inlined stylesheet references fonts relative to the final CSS.
const require = createRequire(import.meta.url)
const katexRoot = path.dirname(require.resolve("katex/package.json"))
await cp(
  path.join(katexRoot, "dist/fonts"),
  path.join(output, "styles/fonts"),
  {
    recursive: true,
  }
)
console.log(`Built ${parsed.fileNames.length} modules, declarations and CSS.`)

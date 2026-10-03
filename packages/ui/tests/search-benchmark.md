# Search benchmark

Measured on Windows, Node.js 24.18.1, Intel Core i5-8250U (1.60 GHz).
Run `pnpm --filter @code-altas/ui bench:search` to reproduce.

| Corpus                  | Locale | Index bytes | Gzip bytes | Load ms | Database heap MB | Warm query P95 ms | Single-character P95 ms |
| ----------------------- | ------ | ----------: | ---------: | ------: | ---------------: | ----------------: | ----------------------: |
| Current docs, 20 pages  | en     |     108,458 |     28,665 |      28 |              0.6 |              5.61 |                    3.79 |
| Current docs, 20 pages  | zh-CN  |     114,226 |     32,883 |      48 |              1.0 |              9.46 |                    2.93 |
| Synthetic, 1,000 pages  | en     |     604,361 |     55,501 |     263 |              2.9 |             15.85 |                   21.70 |
| Synthetic, 1,000 pages  | zh-CN  |     680,100 |     59,018 |     120 |              3.0 |              9.81 |                    7.68 |
| Synthetic, 10,000 pages | en     |   6,445,365 |    993,644 |     829 |             34.6 |             49.86 |                   45.91 |
| Synthetic, 10,000 pages | zh-CN  |   7,331,104 |  1,288,399 |   2,483 |             39.7 |             39.03 |                   25.17 |

Each language gets six query types: a common single character, common words,
a multiword query, a code identifier, and a miss. Three warm-up rounds precede
twelve measured rounds. Queries include ranking and excerpt/highlight generation;
HTTP, network latency and client rendering are excluded. A common term matches
every synthetic page, exercising large candidate sets despite the 20-result cap.
This run had background build/check activity; values vary with machine load.

The synthetic pages are deliberately short and repetitive, each with a heading,
one paragraph and a code block. They exercise document count and broad matches;
they do not predict index size or latency for 10,000 long, diverse real pages.
Current documents are substantially longer than the synthetic pages.

Heap deltas are measured after GC around database loading, excluding build
allocations and process/library overhead. Memory remains per language and per
service instance. Serialization size includes both indexes and text needed for
snippets; none of this index data is sent to browsers.

Initial measurements under concurrent build load exposed unnecessary duplicate
prefix searches. The implementation now checks a sorted title vocabulary before
running a prefix query, while still expanding partial title/heading terms.
These measurements meet the local 100 ms warm-query P95 target. Cold loading
and deployment-specific memory budgets still need to be accounted for.

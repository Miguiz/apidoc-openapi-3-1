import {Command} from 'commander';
import path from 'path';
import {DocOptions} from 'apidoc-light';

const program = new Command();

program
    .description('Generate Swagger documentation for your API.')

    .option('-i, --input <string>', 'Input source files path', './')
    .option('-o, --output <string>', 'Output file or directory to write output', './')
    .option('-c, --config <config>', 'Path to config file or to directory containing config file (apidoc.json or apidoc.config.js).', '')

    .option('-f --file-filters <file-filters>', 'RegEx-Filter to select files that should be parsed (multiple -f can be used).', collect, [])
    .option('-e, --exclude-filters <exclude-filters>', 'RegEx-Filter to select files / dirs that should not be parsed (many -e can be used).', collect, [])

    .option('--definitions', 'Include definitions file rather than copying definitions.', false)
    .option('--encoding <string>', 'Set the encoding of the source code. [utf8].', 'utf8')
    .option('--log-format <string>', 'Change log format. Allowed values: simple, json.', 'simple')
    .option('--markdown [bool]', 'Turn off default markdown parser or set a file to a custom parser.', true)
    .option('-n, --dry-run', 'Parse source files but do not write any output files.', false)
    .option('-p, --private', 'Include private APIs in output.', false)

    .option('-v, --verbose', 'Verbose debug output.', false)

    .option('-d, --debug', 'Show debug messages.', false)
    .option('-q, --quiet', 'Turn all output off', false)

    .option('--filter-by <<tag-filter=value>', 'Filter documentation by tag', '')
    .option('--parse-filters <parse-filters>', 'Optional user defined filters. Format name=filename', collect, [])
    .option('--parse-parsers <parse-parsers>', 'Optional user defined parsers. Format name=filename', collect, [])
    .option('--parse-workers <parse-workers>', 'Optional user defined workers. Format name=filename', collect, []);

program.parse(process.argv);

const argv = program.opts();

export const options: DocOptions & {output?: string} = {
    excludeFilters: ['apidoc\\.config\\.js$', 'node_modules'].concat(argv.excludeFilters.length ? argv.excludeFilters : []),
    includeFilters: argv.fileFilters.length
        ? argv.fileFilters
        : ['.*\\.(clj|cls|coffee|cpp|cs|dart|erl|exs?|go|groovy|ino?|java|js|jsx|kt|litcoffee|lua|mjs|p|php?|pl|pm|py|rb|scala|ts|vue)$'],

    src: argv.input.length ? path.resolve(argv.input) + path.sep : './',
    output: argv.output,

    silent: argv.quiet,
    verbose: argv.verbose,
    debug: argv.debug,
    config: argv.config,

    workers: transformToObject(argv.parseWorkers),

    dryRun: argv.dryRun,

    encoding: argv.encoding,
    markdown: argv.markdown,

    apiprivate: argv.private,

    single: true, // build to single file
};

/**
 * Collect options into an array
 * @param {String} value
 * @param {String[]} acc
 * @returns {String[]}
 */
function collect(value: string, acc: string[]) {
    acc.push(value);
    return acc;
}

/**
 * Transform parameters to object
 *
 * @param {String|String[]} filters
 * @returns {Object}
 */
function transformToObject(filters: string | string[]): object | undefined {
    if (!filters) {
        return;
    }

    if (typeof filters === 'string') {
        filters = [filters];
    }

    const result: Record<string, string> = {};
    filters.forEach((filter) => {
        const splits = filter.split('=');

        if (splits.length === 2) {
            result[splits[0]] = path.resolve(splits[1], '');
        }
    });
    return result;
}

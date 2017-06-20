require( 'colors' );

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;

const RESULTS = '\nTest Results:\n';
const PASS = '  %s passed';
const TIME = ' (%s)\n';
const SKIP = '  %s skipped\n';
const FAIL = '  %s failed\n';
const LOGS = '  %s logged\n';
const FAIL_DESC = '\n  %s) %s:\n';
const FAIL_LOG = '%s';
const LOG_DESC = '\n  %s) %s (';
const LOG_RESULT = '%s';
const LOG_DESC_END = '):\n';
const LOG_LOG = '%s';
const LOG_COLORS = {
    log : 'grey',
    debug : 'cyan',
    warn : 'magenta',
    error : 'red',
};

function format( s, args, color ) {
    function go( acc, rem, _args ) {
        if ( rem.length === 0 ) {
            return acc;
        }
        const idx = rem.indexOf( '%s' );
        if ( idx === -1 || _args.length === 0 ) {
            return acc + rem;
        }
        return go( acc + rem.slice( 0, idx ) + _args[ 0 ], rem.slice( idx + 2 ), _args.slice( 1 ) );
    }

    const result = go( '', s, args );
    return color ? result[ color ] : result;
}

function formatDuration( ms ) {
    if ( ms >= day ) {
        return Math.round( ms / day ) + 'd';
    }
    if ( ms >= hour ) {
        return Math.round( ms / hour ) + 'h';
    }
    if ( ms >= minute ) {
        return Math.round( ms / minute ) + 'm';
    }
    if ( ms >= second ) {
        return Math.round( ms / second ) + 's';
    }
    return ms + 'ms';
}

function formatFailures( failures, formatError, useColors ) {
    return failures
        .reduce(
            function ( acc, failure, idx ) {
                return acc
                    .concat(
                        format(
                            FAIL_DESC,
                            [ idx + 1, getSpecName( failure ) ],
                            useColors && 'red'
                        )
                    )
                    .concat(
                        failure.log.reduce(
                            function ( logAcc, log ) {
                                return logAcc.concat(
                                    format(
                                        FAIL_LOG,
                                        [ formatError( log, '      ' ).replace( /\\n/g, '\n' ) ],
                                        useColors && 'grey'
                                    )
                                );
                            },
                            ''
                        )
                    );
            },
            ''
        )
        .concat( '\n' );
}

function formatLogs( logs, formatLog, useColors ) {
    return logs
        .reduce(
            function ( acc, log, idx ) {
                return acc
                    .concat(
                        format(
                            LOG_DESC,
                            [ idx + 1, getSpecName( log.spec ) ],
                            useColors && 'yellow'
                        )
                    )
                    .concat(
                        format(
                            LOG_RESULT,
                            [ log.spec.success ? 'PASS' : 'FAIL' ],
                            useColors && ( log.spec.success ? 'green' : 'red' )
                        )
                    )
                    .concat( useColors ? LOG_DESC_END.yellow : LOG_DESC_END )
                    .concat(
                        log.logs.reduce(
                            function ( logAcc, log ) {
                                return logAcc.concat(
                                    format(
                                        LOG_LOG,
                                        [ formatLog( log.log, '      ' ).replace( /\\n/g, '\n' ).replace( /'/g, '' ) ],
                                        useColors && LOG_COLORS[ log.type ]
                                    )
                                );
                            },
                            ''
                        )
                    );
            },
            ''
        )
        .concat( '\n' );
}

function getSpecName( result ) {
    return `${ result.suite.join( ' ' ) } ${ result.description }`;
}

/**
 * Format test results.
 *
 * @param {object} opts Options
 * @param {number} opts.passed Number of passing tests
 * @param {number} opts.skipped Number of skipped tests
 * @param {object[]} opts.failures List of failures
 * @param {number} opts.duration Total test duration (ms)
 * @param {function} opts.formatError Error formatter function
 * @param {boolean} opts.useColors Use colors?
 * @return {string}
 */
exports.formatResults = function ( opts ) {
    return ( opts.useColors ? RESULTS.white : RESULTS )
        .concat( format( PASS, [ opts.passed ], opts.useColors && 'green' ) )
        .concat( format( TIME, [ formatDuration( opts.duration ) ], opts.useColors && 'grey' ) )
        .concat(
            opts.skipped
                ? format( SKIP, [ opts.skipped ], opts.useColors && 'cyan' )
                : ''
        )
        .concat(
            opts.failures.length
                ? format( FAIL, [ opts.failures.length ], opts.useColors && 'red' )
                    .concat( formatFailures( opts.failures, opts.formatError, opts.useColors ) )
                : ''
        )
        .concat(
            opts.logs.length
                ? format( LOGS, [ opts.logs.length ], opts.useColors && 'yellow' )
                    .concat( formatLogs( opts.logs, opts.formatError, opts.useColors ) )
                : '',
        )
        .concat( '\n' );
};

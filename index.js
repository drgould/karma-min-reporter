const lib = require( './lib' );

function MinimalReporter( baseReporterDecorator, formatError, config ) {
    baseReporterDecorator( this );

    // temp list of logs
    let logs = [];

    Object.assign( this, {
        _failures : [],
        _logs : [],
        _onRunStart : this.onRunStart,
        _onSpecComplete : this.onSpecComplete,

        _addLogsToMap( spec ) {
            if ( logs.length ) {
                this._logs.push( {
                    spec,
                    logs,
                } );
                logs = [];
            }
        },

        onBrowserLog( browser, log, type ) {
            logs.push( {
                browser,
                type,
                log,
            } );
        },

        onRunComplete( browsers, result ) {
            if ( browsers.length >= 1 && !result.disconnected ) {
                // BrowserCollection lacks a reduce method.
                const skipped =
                    browsers
                        .map( browser => ( browser.lastResult.skipped || 0 ) )
                        .reduce( ( acc, skips ) => ( acc + skips ) );

                this.write( lib.formatResults( {
                    formatError,
                    skipped,
                    duration : ( new Date() ) - this._start,
                    failures : this._failures,
                    logs : this._logs,
                    passed : result.success,
                    useColors : Boolean( config.colors ),
                } ) );
            }
            this._failures.splice( 0, this._failures.length );
        },

        onRunStart() {
            this._onRunStart.call( this );
            this._start = new Date();
        },

        onSpecComplete( browsers, result ) {
            this._onSpecComplete.apply( this, arguments );
            if ( !result.skipped ) {
                this._addLogsToMap( result );
            }
        },

        specFailure( browsers, result ) {
            this._failures.push( result );
        },
    } );
}

MinimalReporter.$inject = [
    'baseReporterDecorator',
    'formatError',
    'config',
];

module.exports = {
    'reporter:minimal' : [
        'type',
        MinimalReporter,
    ],
};

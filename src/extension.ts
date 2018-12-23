'use strict';

import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as util from 'util';

var CompileMql4Extension = function () {
    var outputChannel: vscode.OutputChannel;

    outputChannel = vscode.window.createOutputChannel("MetaEditor");

    function compileFile(path: string) {
        var configuration = vscode.workspace.getConfiguration('compilemql4');

        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine('start compile...');

        let logFile = '';
        let command = '"' + configuration.metaeditorDir + '"';
        command += ' /compile:"' + path + '"';
        if (configuration.includeDir.length > 0) {
            command += ' /include:"' + configuration.includeDir + '"';
        }
        command += ' /log';
        if (configuration.logDir.length > 0) {
            logFile = configuration.logDir;
            command += ':"' + logFile + '"';
        } else {
            logFile = path.slice(0, -3) + 'log';
        }
        // outputChannel.appendLine(command);

        childProcess.exec(command, (error, stdout, stderror) => {
            const readFile = util.promisify(fs.readFile);
            readFile(logFile, 'ucs-2').then((data) => {
                outputChannel.appendLine(deleteBom(data));
            })
                .catch((err) => {
                    throw err;
                });
        });
    }

    function deleteBom (str: string) {
        if (str.charCodeAt(0) === 0xFEFF) {
            return str.slice(1);
        }
        return str;
    }

    return {
        OnSave: function (document: vscode.TextDocument) {
            try {
                var configuration = vscode.workspace.getConfiguration('compilemql4');

                if (configuration.compileAfterSave === true) {
                    compileFile(document.fileName);
                }
            }
            catch (e) {
                vscode.window.showErrorMessage('CompileMQL4: could not generate ex4 file: ' + e);
            }
        },
        CompileFileFromCommand: function () {
            let ed = vscode.window.activeTextEditor;
            if (ed) {
                compileFile(ed.document.fileName);
            }
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    var extension = CompileMql4Extension();

    vscode.workspace.onDidSaveTextDocument(function (document) { extension.OnSave(document) });

    let disposable = vscode.commands.registerCommand('compilemql4.compileFile', () => {
        extension.CompileFileFromCommand();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}

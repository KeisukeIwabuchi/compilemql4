//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import * as assert from 'assert';
import * as vscode from 'vscode';
import { CompileMQL4 } from '../compileMQL4';
import * as pathModule from 'path';

suite("CompileMQL4 Tests", () => {
  test("Test getLogFileName method", async () => {
    const extension = new CompileMQL4();
    let path = "C:\\Test\\MQL4\\Experts\\sample.mq4";
    let fileName: string = pathModule.basename(path);
    let settings = vscode.workspace.getConfiguration("compilemql4");
    
    await settings.update("logDir", "D:\\Hoge\\unittest.log", true).then(() => {
      assert.strictEqual(
        (extension as any).getLogFileName(path, fileName),
        "D:\\Hoge\\unittest.log"
      );
    });

    await settings.update("logDir", "", true).then(() => {
      assert.strictEqual(
        (extension as any).getLogFileName(path, fileName),
        "C:\\Test\\MQL4\\Experts\\compilemql4.log"
      );
    });
  });
  
  test("Test checkExclude method", () => {
    const extension = new CompileMQL4();
    
    // mq4, mqh, mq5はtrue
    assert.strictEqual((extension as any).checkExclude("test.mq4"), true);
    assert.strictEqual((extension as any).checkExclude("test.mqh"), true);
    assert.strictEqual((extension as any).checkExclude("test.mq5"), true);

    // それ以外はfalse
    assert.strictEqual((extension as any).checkExclude("test.js"), false);
    assert.strictEqual((extension as any).checkExclude("test.exe"), false);
  });
});
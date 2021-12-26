import * as vscode from "vscode";

export class TaskProvider implements vscode.TaskProvider {
  static runTaskType = "racket";

  static runTask = new vscode.Task(
    { type: TaskProvider.runTaskType },
    vscode.TaskScope.Workspace,
    "Run Racket File",
    "racket",
    // eslint-disable-next-line no-template-curly-in-string
    new vscode.ShellExecution("${config:magicRacket.general.REPLRacketPath}", ["${file}"]),
  );

  static testTask = new vscode.Task(
    { type: TaskProvider.runTaskType },
    vscode.TaskScope.Workspace,
    "Test Racket File",
    "racket",
    // eslint-disable-next-line no-template-curly-in-string
    new vscode.ShellExecution("raco", ["test", "${file}"]),
  );

  public async provideTasks(): Promise<vscode.Task[]> {
    return this.getTasks();
  }

  public resolveTask(): vscode.Task | undefined {
    return undefined;
  }

  private getTasks(): vscode.Task[] {
    return [TaskProvider.runTask, TaskProvider.testTask];
  }
}

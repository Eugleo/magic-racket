import * as vscode from "vscode";

export class TaskProvider implements vscode.TaskProvider {
  static taskType = "racket";

  static testAndRunTask = new vscode.Task(
    { type: TaskProvider.taskType },
    vscode.TaskScope.Workspace,
    "Test and run file",
    "racket",
    // eslint-disable-next-line no-template-curly-in-string
    new vscode.ShellExecution("${config:magicRacket.general.racketPath}", ["${file}"]),
  );

  static runTask = new vscode.Task(
    { type: TaskProvider.taskType },
    vscode.TaskScope.Workspace,
    "Run file",
    "racket",
    // eslint-disable-next-line no-template-curly-in-string
    new vscode.ShellExecution("${config:magicRacket.general.racketPath}", ["${file}"]),
  );

  static testTask = new vscode.Task(
    { type: TaskProvider.taskType },
    vscode.TaskScope.Workspace,
    "Test file",
    "racket",
    // eslint-disable-next-line no-template-curly-in-string
    new vscode.ShellExecution("${config:magicRacket.general.racoPath}", ["test", "${file}"]),
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

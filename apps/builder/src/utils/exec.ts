import { exec as execCb, type ExecOptions } from "node:child_process"

interface ExecResult {
  stdout: string
  stderr: string
}

export function exec(
  command: string,
  options?: ExecOptions
): Promise<ExecResult> {
  return new Promise<ExecResult>((resolve, reject) => {
    execCb(
      command,
      {
        timeout: 30_000,
        maxBuffer: 10 * 1024 * 1024,
        ...options,
      },
      (err, stdout, stderr) => {
        if (err) {
          const stderrStr = stderr?.toString().trim()
          return reject(new Error(stderrStr || err.message))
        }
        resolve({
          stdout: stdout.toString(),
          stderr: stderr?.toString() ?? "",
        })
      }
    )
  })
}

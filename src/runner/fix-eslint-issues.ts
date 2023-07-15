export function fixEslintIssues(
  code: string,
  filePath: string,
  targetFilePath: string
) {
  let result = code.replace(
    /no-unused-vars/g,
    "@typescript-eslint/no-unused-vars"
  );

  // If the file was a .js file then it probably didn't have any stories.
  // If the new file is a .tsx then we'll be checking if it does have stories
  // so we need to disable `static-service/require-stories` for this file.
  if (filePath.endsWith(".js") && targetFilePath.endsWith(".tsx")) {
    result = "/* eslint-disable static-service/require-stories */\n" + result;
  }

  return result;
}

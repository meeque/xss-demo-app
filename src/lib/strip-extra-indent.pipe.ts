import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripextraindent',
  pure: true,
})
export class StripExtraIndentPipe implements PipeTransform {
  transform(input: unknown): string {
    const inputString = '' + input;
    const lines = inputString.split(/\r?\n/);

    let isFirstLine = true;
    let minIndent = Number.MAX_SAFE_INTEGER;

    for (const line of lines) {
      const firstNonSpace = /\S/.exec(line);
      if (firstNonSpace !== null) {
        const lineIndent = firstNonSpace.index;
        if (
          (isFirstLine && lineIndent > 0) || (!isFirstLine && lineIndent < minIndent)
        ) {
          minIndent = lineIndent;
        }
      }
      isFirstLine = false;
    }

    if (minIndent === 0 || minIndent === Number.MAX_SAFE_INTEGER) {
      return inputString;
    }

    const strippedLines = [] as string[];
    for (const line of lines) {
      const firstNonSpace = /\S/.exec(line);
      if (firstNonSpace?.index >= minIndent) {
        strippedLines.push(line.substring(minIndent));
      }
      else {
        strippedLines.push(line);
      }
    }
    return strippedLines.join('\n');
  }
}

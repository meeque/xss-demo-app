import { StripExtraIndentPipe } from "./strip-extra-indent.pipe";

describe('StripExtraIndentPipe', () => {  

  const pipe = new StripExtraIndentPipe();

  it('should pass through single-line string without indent unchanged', () => {
    expectTransform('foo', 'foo');
    expectTransform('bar\n', 'bar\n');
  });

  it('should unindent single line string with leading space', () => {
    expectTransform('  foo', 'foo');
    expectTransform('\tbar\n', 'bar\n');
    expectTransform('\t  1foo 2bar 3', '1foo 2bar 3');
  });

  it('should unindent multi-line string', () => {
    expectTransform(
      '  foo\n' +
      '    bar\n' +
      '      test\n' +
      '    xxx\n',
      'foo\n' +
      '  bar\n' +
      '    test\n' +
      '  xxx\n'
    );
    expectTransform(
      '      foo\n' +
      '    bar\n' +
      '      test\n' +
      '  xxx',
      '    foo\n' +
      '  bar\n' +
      '    test\n' +
      'xxx'
    );
    expectTransform(
      '  foo\n' +
      '\n' +
      '  bar\n' +
      '  \n' +
      '    test\n',
      'foo\n' +
      '\n' +
      'bar\n' +
      '  \n' +
      '  test\n'
    );
  });

  it('should unindent remaining multi-line string, even when first line has no indent', () => {
    expectTransform(
      'foo\n' +
      '    bar\n' +
      '      test\n' +
      '    xxx\n',
      'foo\n' +
      'bar\n' +
      '  test\n' +
      'xxx\n'
    );
    expectTransform(
      'foo\n' +
      '    bar\n' +
      '      test\n' +
      '  xxx',
      'foo\n' +
      '  bar\n' +
      '    test\n' +
      'xxx'
    );
  });

  it('should coerce other types to string', () => {
    expectTransform([], '');
    expectTransform({}, '[object Object]');
    expectTransform(Promise.all([]), '[object Promise]');
    expectTransform(23, '23');
    expectTransform(true, 'true');
    expectTransform(false, 'false');
    expectTransform(null, 'null');
    expectTransform(undefined, 'undefined');
    expectTransform(/[.]/, '/[.]/');
  });

  it('should format function source code nicely', () => {
    expectTransform(
      mockFunction,
      'function mockFunction(numbers) {\n' +
      '  const theAnswer = 42;\n' +
      '  const result = [];\n' +
      '  for (const num of numbers) {\n' +
      '    result.push(num + theAnswer);\n' +
      '  }\n' +
      '  return result;\n' +
      '}'
    );
  });

  function expectTransform(input: any, expectedOutput: string): void {
    expect(pipe.transform(input)).toBe(expectedOutput);
  }

  function mockFunction(numbers: number[]) {
    const theAnswer = 42;

    const result = [] as number[];
    for (const num of numbers) {
      result.push(num + theAnswer);
    }

    return result;
  }

});
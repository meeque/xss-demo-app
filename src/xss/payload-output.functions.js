/*
 * This file contains plain JS (not TS) functions used by the PayloadOutputService and PayloadOutputComponent.
 * Plain JS is preferred here, because the XSS Demo App both executes these functions and displays them in the UI.
 * Using full-blown TS code would be a distraction here.
 */



export class PayloadProcessors {
  constructor(sanitizer) {
    this.sanitizer = sanitizer;
  }

  htmlEncode(payload) {
    return payload
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  htmlSanitizeDomPurifyDefault(payload) {
    return DOMPurify.sanitize(payload);
  }

  htmlSanitizeDomPurifyMinimalInline(payload) {
    return DOMPurify.sanitize(
      payload,
      {
        ALLOWED_TAGS: ['span', 'em', 'strong'],
        ALLOWED_ATTR: ['class'],
      },
    );
  }

  htmlSanitizeDomPurifyInlineBlockLinks(payload) {
    return DOMPurify.sanitize(
      payload,
      {
        ALLOWED_TAGS: ['span', 'em', 'strong', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
        ALLOWED_ATTR: ['class', 'href', 'target'],
      },
    );
  }

  htmlChallengeStripTags(payload) {
    return payload.replaceAll(/<[/]?[-_.:0-9a-zA-Z]+(\s[^<>]*)?[/]?>/g, '');
  }

  urlValidate(payload) {
    let url;
    try {
      url = new URL(payload, document.baseURI);
    }
    catch (e) {
      return '';
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return payload;
  }

  jsonParse(payload) {
    try {
      return JSON.parse(payload);
    }
    catch (e) {
      console.warn('Expected JSON as payload, but failed to parse it!');
      return {};
    }
  }

  jsEncode(payload) {
    return 'var outputElement = document.createElement(\'div\');\n'
      + 'outputElement.textContent = ' + JSON.stringify(payload) + ';\n'
      + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
  }

  jsDoubleQuote(payload) {
    return 'var outputElement = document.createElement(\'div\');\n'
      + 'outputElement.textContent = "' + payload + '";\n'
      + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
  }

  jsSingleQuote(payload) {
    return 'var outputElement = document.createElement(\'div\');\n'
      + 'outputElement.textContent = \'' + payload + '\';\n'
      + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
  }

  jsChallengeLookMomNoParentheses(payload) {
    const jsEscapedPayload = payload
      .replaceAll('(', '')
      .replaceAll(')', '');
    return 'var outputElement = document.createElement(\'div\');\n'
      + 'outputElement.textContent = ' + jsEscapedPayload + ';\n'
      + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
  }

  jsChallengeLikeLiterally(payload) {
    const jsEscapedPayload = [...payload]
      .map((char) => {
        switch (char) {
          case '\\':
            return '\\\\';
          case '"':
            return '\\"';
          case '\'':
            return '\\\'';
          case '`':
            return '\\`';
        }
        return char;
      })
      .join('');
    return 'var outputElement = document.createElement(\'div\');\n'
      + 'outputElement.textContent = `' + jsEscapedPayload + '`;\n'
      + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
  }

  jsChallengeTheGreatEscape(payload) {
    const jsEscapedPayload = [...payload]
      .map((char) => {
        switch (char) {
          case '"':
            return '\\"';
          case '\'':
            return '\\\'';
          case '`':
            return '\\`';
          case '$':
            return '\\$';
        }
        return char;
      })
      .join('');
    return 'var outputElement = document.createElement(\'div\');\n'
      + 'outputElement.textContent = "' + jsEscapedPayload + '";\n'
      + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
  }

  domTextNode(payload) {
    return document.createTextNode(payload);
  }

  ngTrustAsHtml = (payload) => {
    return this.sanitizer.bypassSecurityTrustHtml(payload);
  };

  ngTrustAsUrl = (payload) => {
    return this.sanitizer.bypassSecurityTrustUrl(payload);
  };

  ngTrustAsResourceUrl = (payload) => {
    return this.sanitizer.bypassSecurityTrustResourceUrl(payload);
  };

  ngTrustAsStyle(payload) {
    return this.sanitizer.bypassSecurityTrustStyle(payload);
  };
}



export class HtmlSourceProviders {
  content(payload) {
    return payload;
  }

  paragraphTitle(payload) {
    return '<p title="' + payload + '">This paragraph has a title.</p>';
  }

  paragraphTitleUnquoted(payload) {
    return '<p title=' + payload + '>This paragraph has a title.</p>';
  }
}



export class DomInjectors {
  textContent(element, payload) {
    element.textContent = payload;
  }

  innerText(element, payload) {
    element.innerText = payload;
  }

  innerHtml(element, payload) {
    element.innerHTML = payload;
  }

  innerHtmlNoOutput(element, payload) {
    document.createElement('div').innerHTML = payload;
  }

  titleAttribute(element, payload) {
    const paragraph = document.createElement('p');
    paragraph.textContent = 'This paragraph has a title.';
    paragraph.setAttribute('title', payload);
    element.insertAdjacentElement('beforeend', paragraph);
  }

  linkHref(element, payload) {
    const link = document.createElement('a');
    link.textContent = 'Click here to test your payload as a URL!';
    link.href = payload;
    link.rel = 'opener';
    link.target = 'xss-demo-xss-probe';
    element.insertAdjacentElement('beforeend', link);
  }

  iframeSrc(element, payload) {
    const iframe = document.createElement('iframe');
    iframe.src = payload;
    element.insertAdjacentElement('beforeend', iframe);
  }

  styleBlock(element, payload) {
    const styleBlock = document.createElement('style');
    styleBlock.setAttribute('type', 'text/css');
    styleBlock.textContent = payload;
    element.insertAdjacentElement('beforeend', styleBlock);
  }

  styleAttribute(element, payload) {
    const styledElement = document.createElement('div');
    styledElement.textContent = 'Element with custom style';
    styledElement.setAttribute('style', payload);
    element.insertAdjacentElement('beforeend', styledElement);
  }

  scriptBlock(element, payload) {
    const scriptBlock = document.createElement('script');
    scriptBlock.type = 'text/javascript';
    scriptBlock.textContent = '\n' + payload + '\n';
    element.insertAdjacentElement('beforeend', scriptBlock);
  }

  challengeDoubleTrouble(element, payload) {
    const headline = document.createElement('h3');
    headline.innerHTML = DOMPurify.sanitize(payload, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    element.insertAdjacentElement('beforeend', headline);
    const paragraph = document.createElement('p');
    paragraph.innerHTML = 'The above headline says:<br><em>' + headline.innerText + '</em>';
    element.insertAdjacentElement('beforeend', paragraph);
  }
}



export class JQueryInjectors {
  text(element, payload) {
    $(element).text(payload);
  }

  html(element, payload) {
    $(element).html(payload);
  }

  jQueryConstructor(element, payload) {
    $(payload).appendTo(element);
  }

  prepend(element, payload) {
    $(element)
      .html($('<p>').text('This is a static paragraph. Prepending to its parent element...'))
      .prepend(payload);
  }

  append(element, payload) {
    $(element)
      .html($('<p>').text('This is a static paragraph. Appending to its parent element...'))
      .append(payload);
  }

  before(element, payload) {
    $('<p>').text('This is a static paragraph. Inserting before it...')
      .prependTo(element)
      .before(payload);
  }

  after(element, payload) {
    $('<p>').text('This is a static paragraph. Inserting after it...')
      .appendTo(element)
      .after(payload);
  }

  wrapInner(element, payload) {
    $(element)
      .html(
        $('<p>').text('This is a static paragraph. Wrapping around its contents...').wrapInner(payload),
      );
  }

  wrap(element, payload) {
    $('<p>').text('This is a static paragraph. Wrapping around all its parent\'s contents...')
      .appendTo(element)
      .wrap(payload);
  }

  replaceWith(element, payload) {
    $('<p>').text('This is a static paragraph. Replacing it...')
      .appendTo(element)
      .replaceWith(payload);
  }

  titleAttribute(element, payload) {
    $(element)
      .html(
        $('<p>').text('This paragraph has a title.').attr('title', payload),
      );
  }

  linkHref(element, payload) {
    $(element)
      .html(
        $('<a target="xss-demo-xss-probe" rel="opener">').text('Click here to test your payload as a URL!').attr('href', payload),
      );
  }

  iframeSrc(element, payload) {
    $(element)
      .html(
        $('<iframe>').attr('src', payload),
      );
  }
}

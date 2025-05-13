

(function() {

  const XssDemoApp = {
    PayloadOutputFunctions: {

      PayloadProcessors: class PayloadProcessors {

        constructor(sanitizer) {
          this.sanitizer = sanitizer;
        }

        ngTrustedHtml = (payload) => {
          return this.sanitizer.bypassSecurityTrustHtml(payload);
        }

        ngTrustedUrl = (payload) => {
          return this.sanitizer.bypassSecurityTrustUrl(payload);
        }

        ngTrustedResourceUrl = (payload) => {
          return this.sanitizer.bypassSecurityTrustResourceUrl(payload);
        }

        ngTrustedStyle(payload) {
          return this.sanitizer.bypassSecurityTrustStyle(payload);
        }

        domTextNode(payload) {
          return document.createTextNode(payload);
        }

        htmlEncoding(payload) {
          return payload
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;');
        }

        htmlSanitizingDomPurify(payload) {
          return DOMPurify.sanitize(payload);
        }

        htmlSanitizingDomPurifyMinimalInline(payload) {
          return DOMPurify.sanitize(
            payload,
            {
              ALLOWED_TAGS: ['span', 'em', 'strong'],
              ALLOWED_ATTR: ['class']
            });
        }

        htmlSanitizingDomPurifyInlineBlockLinks(payload) {
          return DOMPurify.sanitize(
            payload,
            {
              ALLOWED_TAGS: ['span', 'em', 'strong', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
              ALLOWED_ATTR: ['class', 'href', 'target']
            });
        }

        urlValidation(payload) {
          try {
            var url = new URL(payload, document.baseURI);
          } catch(e) {
            return '';
          }
          if (!["http:", "https:"].includes(url.protocol)) {
            return '';
          }
          return payload;
        }

        jsonParsing(payload) {
          try {
            return JSON.parse(payload);
          } catch (e) {
            console.warn('Expected JSON as payload, but failed to parse it!')
            return {};
          }
        }

        jsEncoding(payload) {
          return 'var outputElement = document.createElement(\'div\');\n'
              + 'outputElement.textContent = ' + JSON.stringify(payload) + ';\n'
              + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
        }

        jsDoubleQuoting(payload) {
          return 'var outputElement = document.createElement(\'div\');\n'
              + 'outputElement.textContent = "' + payload + '";\n'
              + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
        }

        jsSingleQuoting(payload) {
          return 'var outputElement = document.createElement(\'div\');\n'
              + 'outputElement.textContent = \'' + payload + '\';\n'
              + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
        }
      },

      HtmlSourceProviders: class HtmlSourceProviders {

        raw(payload) {
          return payload;
        }

        paragraphTitle(payload) {
          return '<p title="' + payload + '">This paragraph has a title.</p>';
        }

        unquotedParagraphTitle(payload) {
          return '<p title=' + payload + '>This paragraph has a title.</p>';
        }
      },

      DomInjectors: class DomInjectors {

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
          let paragraph = document.createElement('p');
          paragraph.textContent = 'This paragraph has a title.'
          paragraph.setAttribute('title', payload);
          element.insertAdjacentElement('beforeend', paragraph);
        }

        linkHref(element, payload) {
          let link = document.createElement('a');
          link.textContent = 'Click here to test your payload as a URL!'
          link.href = payload;
          link.rel = 'opener';
          link.target = 'xss-demo-xss-probe';
          element.insertAdjacentElement('beforeend', link);
        }

        iframeSrc(element, payload) {
          let iframe = document.createElement('iframe');
          iframe.src = payload;
          element.insertAdjacentElement('beforeend', iframe);
        }

        trustedStyleBlock(element, payload) {
          let styleBlock = document.createElement('style');
          styleBlock.setAttribute('type', 'text/css');
          styleBlock.textContent = payload;
          element.insertAdjacentElement('beforeend', styleBlock);
        }

        trustedStyleAttribute(element, payload) {
          let styledElement = document.createElement('div');
          styledElement.textContent = 'Element with custom style';
          styledElement.setAttribute('style', payload);
          element.insertAdjacentElement('beforeend', styledElement);
        }

        trustedScriptBlock(element, payload) {
          setTimeout(
            () => {
              let scriptBlock = document.createElement('script');
              scriptBlock.type = 'text/javascript';
              scriptBlock.textContent = '\n' + payload + '\n';
              element.insertAdjacentElement('beforeend', scriptBlock);
            }
          );
        }

        challengeDoubleTrouble(element, payload) {
          const headline = document.createElement('h3');
          headline.innerHTML = DOMPurify.sanitize(payload, {ALLOWED_TAGS:[], ALLOWED_ATTR:[]});
          element.insertAdjacentElement('beforeend', headline);
          const paragraph = document.createElement('p');
          paragraph.innerHTML = 'The above headline says:<br><em>' + headline.innerText + '</em>'
          element.insertAdjacentElement('beforeend', paragraph);
        }
      },

      JQueryInjectors: class JQueryInjectors {

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
              $('<p>').text('This is a static paragraph. Wrapping around its contents...').wrapInner(payload)
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
              $('<p>').text('This paragraph has a title.').attr('title', payload)
            );
        }

        linkHref(element, payload) {
          $(element)
            .html(
              $('<a target="xss-demo-xss-probe" rel="opener">').text('Click here to test your payload as a URL!').attr('href', payload)
            );
        }

        iframeSrc(element, payload) {
          $(element)
            .html(
              $('<iframe>').attr('src', payload)
            );
        }
      }
    }
  }

  window.XssDemoApp = window.XssDemoApp || {};
  Object.assign(window.XssDemoApp, XssDemoApp);

})();

/* exported pageStatus, $enable, $disable, $remove */

function pageStatus($container) {
  if ($container) {
    const $elementOrigin = $container.querySelector('.origin code');
    if ($elementOrigin) {
      $elementOrigin.textContent = window.origin;
    }
    const $elementEffectiveDomain = $container.querySelector('.effective-domain code');
    if ($elementEffectiveDomain) {
      $elementEffectiveDomain.textContent = window.document.domain;
    }
  }
}

function $enable(... $elements) {
  for (const $element of $elements) {
    $element.disabled = false;
  }
}

function $disable(... $elements) {
  for (const $element of $elements) {
    $element.disabled = true;
  }
}

function $remove($node) {
  if ($node && $node.parentNode) {
    $node.parentNode.removeChild($node);
  }
}

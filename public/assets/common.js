
function pageStatus($container) {
    if ($container) {
        $elementOrigin = $container.querySelector('.origin code');
        if ($elementOrigin) {
            $elementOrigin.textContent = window.origin;
        }
        $elementEffectiveDomain = $container.querySelector('.effective-domain code');
        if ($elementEffectiveDomain) {
            $elementEffectiveDomain.textContent = window.document.domain;
        }
    }
}

function $enable() {
    for (const arg of arguments) {
        arg.disabled = false;
    }
}

function $disable() {
    for (const arg of arguments) {
        arg.disabled = true;
    }
}

function $remove($node) {
    if ($node && $node.parentNode) {
        $node.parentNode.removeChild($node);
    }
}

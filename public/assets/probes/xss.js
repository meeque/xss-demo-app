let parentXssError = null;
let openerXssError = null;



// the gist:

try {
    window.parent.xss();
} catch (err) {
    parentXssError = err;
}

try {
    window.opener.xss();
} catch (err) {
    openerXssError = err;
}



// diagnostics:

function diagnostics($status, target, xssError) {

    if (xssError !== null) {
        $status.querySelector('code.error').textContent = xssError;
        $status.classList.add('xss-error');
    } else {
        $status.classList.add('xss-success');
    }

    if (target === null) {
        $status.classList.add('has-no-target');
        return;
    } else {
        $status.classList.add('has-target');
    }

    let targetXss = null;
    try {
        targetXss = target.xss;
    } catch (err) {
        console.log('Failed to access xss functions in target: ' + err);
    }

    if (targetXss == null) {
        $status.classList.add('xss-unavailable');
        return;
    } else {
        $status.classList.add('xss-available');
    }

    if (typeof target.xss !== 'function') {
        $status.classList.add('xss-not-invoked');
        return;
    } else {
        $status.classList.add('xss-invoked');
    }
}

document.addEventListener(
    'DOMContentLoaded',
    () => {
        diagnostics(
            document.querySelector('li.target.parent ul.status'),
            window.parent != window ? window.parent : null,
            parentXssError);

        diagnostics(
            document.querySelector('li.target.opener ul.status'),
            window.opener,
            openerXssError);
    }
);

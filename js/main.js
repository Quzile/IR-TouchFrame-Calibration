const marker = $('<div>').addClass('marker top-left');
const markerText = $('<span>');
marker.append(markerText);
$('body').append(marker);

$('#screen-dimensions').text(`${window.innerWidth}x${window.innerHeight}`);

$('#restart-calibration').hide();
$('.infoBox__result').hide();

const results = [];

function updatePosition(className) {
    marker.removeClass('top-left top-right bottom-left bottom-right');
    marker.addClass(className);
}

function updateMarkerText() {
    const rect = marker[0].getBoundingClientRect();
    const x_marker = rect.left + window.pageXOffset + rect.width / 2;
    const y_marker = rect.top + window.pageYOffset + rect.height / 2;
    markerText.text(`(${x_marker}, ${y_marker})`);
}

function saveCoord(e) {
    const x_touch = e.clientX;
    const y_touch = e.clientY;

    const rect = marker[0].getBoundingClientRect();
    const x_marker = rect.left + window.pageXOffset + rect.width / 2;
    const y_marker = rect.top + window.pageYOffset + rect.height / 2;

    const message = `TouchIndex [${
        results.length + 1
    }] | TouchCoord [x=${x_touch}, y=${y_touch}] | MarkerCoord [x=${x_marker}, y=${y_marker}]`;

    $('#last-touch').text(`[x=${x_touch}, y=${y_touch}]`);
    $('#last-marker').text(`[x=${x_marker}, y=${y_marker}]`);
    console.log(message);

    results.push({
        touch: { x: x_touch, y: y_touch },
        marker: { x: x_marker, y: y_marker },
    });
}

function calculateDeviations() {
    return results.map(result => {
        return {
            x: result.marker.x / result.touch.x,
            y: result.marker.y / result.touch.y,
        };
    });
}

function showResults() {
    $(document).off('click', handleClick);
    marker.hide();
    $('#restart-calibration').show();

    const deviations = calculateDeviations();
    const averageX = deviations.reduce((sum, deviation) => sum + deviation.x, 0) / deviations.length;
    const averageY = deviations.reduce((sum, deviation) => sum + deviation.y, 0) / deviations.length;

    const click_0_X = results[0].touch.x;
    const click_0_Y = results[0].touch.y;
    const click_3_X = results[3].touch.x;
    const click_3_Y = results[3].touch.y;

    const correctedClick0X = click_0_X * averageX;
    const correctedClick0Y = click_0_Y * averageY;
    const correctedClick3X = click_3_X * averageX;
    const correctedClick3Y = click_3_Y * averageY;

    const a = (window.innerWidth * 6) / 8 / (correctedClick3X - correctedClick0X);
    const c = (window.innerWidth / 8 - a * correctedClick0X) / window.innerWidth;
    const e = (window.innerHeight * 6) / 8 / (correctedClick3Y - correctedClick0Y);
    const f = (window.innerHeight / 8 - e * correctedClick0Y) / window.innerHeight;
    const command = `xinput set-prop "{YOUR FRAME ID}" "libinput Calibration Matrix" ${a}, 0.0, ${c}, 0.0, ${e}, ${f}, 0.0, 0.0, 1.0`;
    $('#finish-command').text(`$ ${command}`);
    $('#finish-command').on('click', function clickResult(e) {
        navigator.clipboard
            .writeText(command)
            .then(() => {
                Toastify({
                    text: 'The command is saved to the clipboard',
                    duration: 3000,
                    newWindow: true,
                    close: true,
                    gravity: 'bottom', // `top` or `bottom`
                    position: 'center', // `left`, `center` or `right`
                    stopOnFocus: true, // Prevents dismissing of toast on hover
                    style: {
                        background: 'linear-gradient(to right, #00b09b, #96c93d)',
                    },
                    onClick: function () {}, // Callback after click
                }).showToast();
            })
            .catch(err => {
                console.log('Something went wrong', err);
            });
    });

    $('.infoBox__result').show();
}

function calibrationRestart() {
    location.reload();
}

function handleClick(e) {
    const currentClass = marker.hasClass('top-left')
        ? 'top-left'
        : marker.hasClass('top-right')
        ? 'top-right'
        : marker.hasClass('bottom-left')
        ? 'bottom-left'
        : 'bottom-right';
    saveCoord(e);

    switch (currentClass) {
        case 'top-left':
            updatePosition('top-right');
            break;
        case 'top-right':
            updatePosition('bottom-left');
            break;
        case 'bottom-left':
            updatePosition('bottom-right');
            break;
        case 'bottom-right':
            showResults();
            break;
    }

    updateMarkerText();
}

$(document).on('click', handleClick);
updateMarkerText();

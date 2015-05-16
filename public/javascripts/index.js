$(function() {
    var socket = io.connect('http://192.168.1.102:8000');
    var timeContainers;
    var updateTimer;

    $('#tryBtn').on('click', function() {
        waitingDialog.show();

        navigator.geolocation.getCurrentPosition(function(position) {
            socket.emit('getClosestStops', position.coords);
        }, function(err) {
            console.log('An error ocurred while getting geolocation data:' + err);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000
        });

        // if you want to mock up your location, this is Powell & Market St
        // socket.emit('getClosestStops', {
        //     latitude: 37.7847999,
        //     longitude: -122.40768
        // });
    });

    $('#myModal').on('hide.bs.modal', function(e) {
        clearInterval(updateTimer);
    });

    socket.on('closestStops', function(data) {
        waitingDialog.hide();
        $('#myModal').modal();
        var tableHTML = '';
        data.forEach(function(stop) {
            var stopHTML = '';
            var tr = $('<tr class="vcenter"> <td rowspan=2></td> <td rowspan=2></td> <td rowspan=2></td> <td rowspan=2></td> <td rowspan=2></td> <th>Current</th><th>Next</th></tr>');
            tr.addClass(stop.agency + '-' + stop.route + '-' + stop.stopId);

            tr.children()[0].innerHTML = stop.agency;
            tr.children()[1].innerHTML = stop.route;
            tr.children()[2].innerHTML = stop.title;
            tr.children()[3].innerHTML = stop.distance;
            var tr2 = $('<tr class="vcenter"> <td></td><td></td></tr');
            tr2.addClass(stop.agency + '-' + stop.route + '-' + stop.stopId);
            if (stop.departures) {

                if (stop.departures[0].error) {
                    tr.addClass('warning');
                    tr.children().attr('rowspan', 1);
                    tr.children()[4].innerHTML = stop.departures[0].direction;
                    tr.find('th').remove();
                    tr.append('<td colspan=2><span error="' + stop.departures[0].error +
                        '">No predictions for this stop</span></td>');
                    stopHTML = tr[0].outerHTML;

                } else {
                    tr.children()[4].innerHTML = stop.departures[0].direction;
                    tr2.children()[0].innerHTML += '<span seconds="' + stop.departures[0].seconds + '"> ' +
                        moment(stop.departures[0].seconds * 1000).format('mm:ss') + '</span>';
                    if (stop.departures[1]) {
                        tr2.children()[1].innerHTML += '<span seconds="' + stop.departures[1].seconds + '">' +
                            moment(stop.departures[1].seconds * 1000).format('mm:ss') + '</span>';
                    }
                    stopHTML = tr[0].outerHTML + tr2[0].outerHTML;
                }
            }

            tableHTML += stopHTML;
        });

        $('#departuresTable tbody').append(tableHTML);
        timeContainers = $('.table td span');
        updateTimer = setInterval(updateRemainingTime, 1000);
    });

    socket.on('closestStopsUpdate', function(data) {
        data.forEach(function(stop) {
            if (stop.departures && stop.departures[0] && stop.departures[0].error) {
                return;
            }
            var spans = $('.' + stop.agency + '-' + stop.route + '-' + stop.stopId + ' span');
            spans.each(function(index) {
                $(this).attr('seconds', stop.departures[index].seconds);
                $(this).html(moment(stop.departures[index].seconds * 1000).format('mm:ss'));
                var parent = $(this).parent();
                $(this).parent().animate({
                    'background-color': '#D1FCCF'
                }, 600, function() {
                    parent.animate({
                        'background-color': '#FFF'
                    }, 600);
                });
            });
        });
    });

    var waitingDialog = (function($) {
        // Creating modal dialog's DOM
        var $dialog = $(
            '<div class="modal fade" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">' +
            '<div class="modal-dialog modal-m">' +
            '<div class="modal-content">' +
            '<div class="modal-header"><h3 style="margin:0;"></h3></div>' +
            '<div class="modal-body">' +
            '<div class="progress progress-striped active" style="margin-bottom:0;"><div class="progress-bar" style="width: 100%"></div></div>' +
            '</div>' +
            '</div></div></div>');

        return {
            /**
             * Opens our dialog
             * @param message Custom message
             * @param options Custom options:
             *                options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
             *                options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
             */
            show: function(message, options) {
                // Assigning defaults
                var settings = $.extend({
                    dialogSize: 'm',
                    progressType: ''
                }, options);
                if (typeof message === 'undefined') {
                    message = 'Loading';
                }
                if (typeof options === 'undefined') {
                    options = {};
                }
                // Configuring dialog
                $dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
                $dialog.find('.progress-bar').attr('class', 'progress-bar');
                if (settings.progressType) {
                    $dialog.find('.progress-bar').addClass('progress-bar-' + settings.progressType);
                }
                $dialog.find('h3').text(message);
                // Opening dialog
                $dialog.modal();
            },
            /**
             * Closes dialog
             */
            hide: function() {
                $dialog.modal('hide');
            }
        };

    })(jQuery);

    function updateRemainingTime() {
        timeContainers.each(function() {
            if ($(this).attr('error')) {
                return;
            }

            var seconds = +$(this).attr('seconds');

            if (seconds === 0) {
                $(this).html('Departed!');
                return;
            }
            seconds--;
            $(this).attr('seconds', seconds);
            $(this).html(moment(seconds * 1000).format('mm:ss'));
        });
    }
});
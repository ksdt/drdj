var audio, audioCtx, source, analyser, ctx, canvas, draw, dz, pad, gradient;
Dropzone.autoDiscover = false;


audioCtx = new (window.AudioContext || window.webkitAudioContext)();
canvas = document.getElementById("dbmeter");
ctx = canvas.getContext('2d');


var grid = new Array(5);
for (var i = 0; i < grid.length; i++) {
    grid[i] = new Array(6);
}


function initCanvas() {
    ctx = canvas.getContext('2d');
    canvas.width = $('.container').width();
    window.addEventListener('resize', resize, false);
    function resize() {
        canvas.width = $('.container').width();
        gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'green');
        gradient.addColorStop(0.50, 'rgb(255, 255, 0)');
        gradient.addColorStop(0.75, '#f06d06');
        gradient.addColorStop(1, 'purple');
    }
    resize();
}
function serializeButtons() {
    var sGrid = new Array(5);
    for (var i = 0; i < grid.length; i++) {
        sGrid[i] = new Array(6);
        for (var j = 0; j < grid[i].length; j++) {
            sGrid[i][j] = grid[i][j].serialize();
        }
    }
    $.ajax({
        url: '/samplebuttons/'+pad+'/'+$('#secret').val(),
        data: JSON.stringify(sGrid),
        contentType : 'application/json',
        type: 'POST',
        success: function(e) { console.log(e); }
    });

}


function urlExists(url, callback){
  $.ajax({
    type: 'HEAD',
    url: url,
    success: function(){
      callback(true);
    },
    error: function() {
      callback(false);
    }
  });
}

function initButtons() {
    $.each($('.sample'), function (k, v) {
        var row = Math.floor(k / 6);
        var col = k % 6;
        var b = grid[row][col] = Object.create(Button);
        b.row = row;
        b.col = col;
        b.elem = v;
        urlExists('uploads/'+pad+'-'+row+'-'+col, function(exists) {
            if (exists) {
                b.source = 'uploads/'+pad+'-'+row+'-'+col;
                $(b.elem).addClass('audio-loading');
                b.loadAudio();
            } else {
                $(b.elem).attr('disabled', true);
                
            }
        });
    });

    $.get('uploads/'+pad+'.json')
        .done(function (data) {
            console.log(data);
            var sGrid = data;
            for (var i = 0; i < sGrid.length; i++) {
                for (var j = 0; j < sGrid[i].length; j++) {
                    if (sGrid[i][j].name)
                        grid[i][j].setName(sGrid[i][j].name);
                    if (sGrid[i][j].btnType)
                        grid[i][j].setType(sGrid[i][j].btnType);
                }
            }
        })
        .fail(function (e) {
            console.log('config not found');
        });
}

function msg(s) {
    console.log(s);
}

var Button = {
    audio : '',
    ctxsource: '',
    analyser: '',
    analyser2: '',
    splitter: '',
    byteFreqData: '',
    byteFreqData2: '',
    loadAudio : function() {
        this.audio = new Audio(this.source + '?'+ Date.now());
        console.log(this.audio);
        var b = this;
        this.audio.addEventListener('canplay', function() {
            this.removeEventListener('canplay',arguments.callee,false);
            b.state = 1;
            $(b.elem).removeClass('audio-loading');

            b.ctxsource = audioCtx.createMediaElementSource(b.audio);

            b.splitter = audioCtx.createChannelSplitter();

            b.ctxsource.connect(b.splitter);

            b.analyser = audioCtx.createAnalyser();
            b.analyser.smoothingTimeConstant = 0.8;
            b.analyser.frequencyBinCount = 10;

            b.analyser2 = audioCtx.createAnalyser();
            b.analyser2.smoothingTimeConstant = 0.8;
            b.analyser2.frequencyBinCount = 10;

            b.splitter.connect(b.analyser, 0, 0);
            b.splitter.connect(b.analyser2, 1, 0);

            b.byteFreqData = new Uint8Array(b.analyser.frequencyBinCount);
            b.byteFreqData2 = new Uint8Array(b.analyser2.frequencyBinCount);
        });
        this.audio.addEventListener('play', function() {
            b.state = 2;
            $(b.elem).addClass('audio-playing');
            b.ctxsource.connect(audioCtx.destination);
        });
        this.audio.addEventListener('pause', function() {
            this.currentTime = 0;
            b.state = 1;
            $(b.elem).removeClass('audio-playing');
            b.ctxsource.disconnect(audioCtx.destination);
            b.ctxsource.connect(b.splitter);
        });
        this.audio.addEventListener('ended', function() {
            b.state = 1;
            $(b.elem).removeClass('audio-playing');
            b.ctxsource.disconnect(audioCtx.destination);
            b.ctxsource.connect(b.splitter);
        });
            
    },
    source : "",
    text   : "",
    states : ['LOADING', 'STOPPED', 'PLAYING'],
    state : 0,
    id : "",
    elem : '',
    setName : function(name) {
        this.name = name;
        $(this.elem).html(name);
    },
    click: function() {
        if (this.state === 0) {
            //clicked on load
            msg('still loading this audio');
        } else if (this.state === 1) {
            this.audio.play();
        } else if (this.state === 2) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    },
    buffer : "",
    btnType : 'btn-default',
    setType : function(type) {
       $.each(colorClasses, function(k, v) {
          $(this.elem).removeClass(v);
       });
       $(this.elem).addClass(type);
       this.btnType = type;
    },
    row: -1,
    col: -1,
    form: '',
    serialize: function() {
        return { 'name' : this.name, 'btnType': this.btnType };
    }
};


var MODE = "READY";
var colorClasses = [
    'btn-default',
    'btn-primary',
    'btn-success',
    'btn-info',
    'btn-warning',
    'btn-danger'
];

function showEdit(row, col, obj) {
    var name, color;
    name = $(obj).html();
    var colorIdx;
    for (colorIdx = 0; colorIdx < colorClasses.length; colorIdx++) {
        if ($(obj).hasClass(colorClasses[colorIdx]))
            break;
    }
    colorIdx = colorIdx;

    var $radios = $('input[type="radio"][name="inlineRadioOptions"]');


    $('#name').html(name);
    $radios.eq(colorIdx).prop("checked", true);

    $('.editing-panel').show();
}





var currentEditRow, currentEditCol;


$(document).ready(function() {
    pad = window.location.pathname.replace(/^\/([^\/]*).*$/, '$1');

    initButtons();

    Waves.attach('.btn');
    Waves.init();

    initCanvas();

    $('.edit-mode').click(function() {
        if (MODE == "READY") {
            /* enter edit mode */
            MODE = "EDITING";
            $('body').css('background-color', '#F9690E');
            $(this).html('disable edit mode');
            $('#secret').show();
            $.each($('button'), function(k, v) {
                $(v).attr('disabled', false);
            });
        } else {
            MODE = "READY";
            $('.editing-panel').hide();
            $('#secret').hide();
            $('body').css('background-color', '');
            $(this).html('enable edit mode');
            $.each($('.sample'), function(k, v) {
                var rowClass = $(v).parent().parent().attr('class');
                var row = parseInt(rowClass.replace(/row/, '').replace(/ row-/, '')) - 1;
                var col = $('.col-sm-2').index($(v).parent()) % 6;
                if (grid[row][col].source === '')
                    $(v).attr('disabled', true);
            });
        }
    });

    $('.sample').click(function() {
        var rowClass = $(this).parent().parent().attr('class');
        var row = parseInt(rowClass.replace(/row/, '').replace(/ row-/, '')) - 1;
        var col = $('.col-sm-2').index($(this).parent()) % 6;
        if (MODE == "READY") {
            grid[row][col].click();
        } else if (MODE == "EDITING") {
            showEdit(row, col, $(this));

            currentEditRow = row;
            currentEditCol = col;

            if (dz) {
                dz.url = '/sample/'+pad+'/'+row+'/'+col+'/'+$('#secret').val();
                dz.enable();
                dz.element.innerHTML = 'click to select audio file';
            } else {
                dz = new Dropzone('div#fileInput', { url: '/sample/'+pad+'/'+row+'/'+col+'/'+$('#secret').val() });
            }
            dz.on('sending', function(e) {
                this.element.innerHTML = 'uploading...';
            });
            dz.on('complete', function(file, e) {
                this.element.innerHTML = 'uploaded';
                this.disable();
                grid[currentEditRow][currentEditCol].source = 'uploads/'+pad+'-'+row+'-'+col;
            });
        }
    });

    $('#cancel').click(function() {
        $('.editing-panel').hide();
    });
    $('#delete').click(function() {
        $.post('dsample/'+pad+'/'+currentEditRow+'/'+currentEditCol+'/'+$('#secret').val());
        $('.editing-panel').hide();
        var b = grid[currentEditRow][currentEditCol];
        b.name = '';
        b.btnType = 'btn-default';
        serializeButtons();
        window.location.reload();
    });

    $('#save').click(function() {
        var name = $('#name').val();
        var $radios = $('input[type="radio"][name="inlineRadioOptions"]');
        var color = $('input:checked').next().attr('class').replace(/ waves-effect/, '').replace(/btn /, '');

        var b = grid[currentEditRow][currentEditCol];
        var e = b.elem;
        $(e).html(name);
        b.setType(color);
        b.name = name;
        serializeButtons();
        b.loadAudio();
        $('.editing-panel').hide();
    });


    var anim;
    function animationFrame() {
        anim = requestAnimationFrame(animationFrame);
        var byteArrays = []; //3d array to hold [[L, R], [L, R]....
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var playing = [];
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid.length; j++) {
                var b = grid[i][j];
                if (b.state === 2) {
                    playing.push([b.byteFreqData, b.byteFreqData2, b.analyser, b.analyser2]);
                }
            }
        }
        if (playing.length > 0) { /* if a song is playing */
            /* get all the byteFrequency dumps from the respective analysers */
            for (i = 0; i < playing.length; i++) {
                var bfa1 = playing[i][0];
                var bfa2 = playing[i][1];
                var ana1 = playing[i][2];
                var ana2 = playing[i][3];

                ana1.getByteFrequencyData(bfa1);
                ana2.getByteFrequencyData(bfa2);
                byteArrays.push([bfa1, bfa2]);
            }
            if (byteArrays.length === 0)
                return;
            var sum = [0, 0];
            for (i = 0; i < byteArrays.length; i++) {
                /* left sum */
                var tempSum = [0, 0];
                for (var b = 0; b < byteArrays[i][0].length; b++) {
                    tempSum[0] += byteArrays[i][0][b];
                }
                for (b = 0; b < byteArrays[i][1].length; b++) {
                    tempSum[1] += byteArrays[i][1][b];
                }
                if (tempSum[0] > sum[0])
                    sum[0] = tempSum[0];
                if (tempSum[1] > sum[1])
                    sum[1] = tempSum[1];
            }
            var avg = [sum[0] / (byteArrays[0][0].length), sum[1] / (byteArrays[0][0].length)];
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, (avg[0] / 100) * canvas.width, canvas.height / 2);
            ctx.fillRect(0, canvas.height / 2, (avg[1] / 100) * canvas.width, canvas.height);
        }
    } animationFrame();
});

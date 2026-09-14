window.R=(function(){
       var data={};
       return function(a,b,c){
            if(b){
                if(c==="audio"){
                    var audio=data[a]=document.createElement("audio");
                    audio.src=b;
                    audio.replay=function(){
                        this.currentTime=0;
                        var promise=this.play();
                        if(promise&&promise.catch){
                            promise.catch(function(){});
                        }
                    }
                    document.body.appendChild(audio);   
                }else{
                 var img=data[a]=document.createElement("img");
                 img.src=b;
                 img.style.display="none";
                 img.onload=function(){
                     this.parentNode.removeChild(this);
                 }.bind(img);
                 document.body.appendChild(img);
               }
            }
            return data[a];
       };
})(); 

;+(function(window,document){
//加载资源
R("sky","asset/sky.png");
R("ground","asset/ground.png");
R("bird","asset/bird.png");
R("holdback","asset/holdback.png");
R("number","asset/number.png");
R("over","asset/over.png");
R("ready","asset/ready.png");
R("@fly","asset/fly.wav","audio");
R("@die","asset/die.wav","audio");
R("@buzzy","asset/buzzy.wav","audio");
R("@score","asset/score.wav","audio");

window.onload = function(){
    game.init();
}

var game={
    lastTime:0,
    //单帧最大时间跨度（秒），防止切回标签页时位移跳变
    maxDelta:0.1,
    unitWidth:0,
    unitHeight:0,
    gameState:"ready",//ready,playing,pause,over
    canvas:null,
    g:null,
    
    
    background:null,
    bird:null,
    
    
    init:function(){
        //创建舞台
        this.initStage();
        //创建背景
        this.background=new Background(this);
        //创建ready场景
        this.readySence=new ReadyScene(this);
        //创建over场景
        this.overScene=new OverScene(this);
        //创建鸟
        this.bird=new Bird(this);
        //创建障碍物
        this.holdback=new Holdback(this);
        //创建计分器
        this.scoreIndicator=new ScoreIndicator(this);
        //绑定事件
        this.bindListener();
        //开始
        this.run=this.run.bind(this);
        window.requestAnimationFrame(this.run);
    },
    initStage:function(){
        var cvs=this.canvas=document.getElementById("canvas");
        this.g=cvs.getContext("2d");
        var screenWidth=document.body.offsetWidth;
        var screenHeight=document.body.offsetHeight;
        cvs.width=Math.min(screenWidth,440);
        cvs.height=Math.min(screenHeight,740);
        this.unitWidth=cvs.width/9;
        this.unitHeight=cvs.height/16;
    },
    bindListener:function(){
        var handler=function(e){
            e.preventDefault();
            switch(this.gameState){
                case "ready":
                    this.play();
                    break;
                case "playing":
                    this.bird.fly();
                    break;
                case "over":
                    this.replay();
                    break;    
            }
        }.bind(this);
        var eventName=window.PointerEvent?"pointerdown"
            :("ontouchstart" in window?"touchstart":"mousedown");
        this.canvas.addEventListener(eventName,handler);
    },
    play:function(){
        this.gameState="playing";  
        this.bird.state="flying";
    },
    replay:function(){
        this.gameState="ready";
        this.bird.reset();   
        this.holdback.reset();
        this.scoreIndicator.reset();
    },
    gameOver:function(){
         this.gameState="over";
    },
    throughOneHose:function(){
        this.scoreIndicator.gotScore();
        this.holdback.applyDifficulty(this.scoreIndicator.score);
    },
    update:function(dt){
       this.background.update(dt);
       if(this.gameState==="playing"){
           this.holdback.update(dt);
       }
       this.bird.update(dt);
    },
    render:function(){
       var g= this.g;
       this.background.paintSky(g);
       switch(this.gameState){
           case "ready":
                this.readySence.paint(g);
                break;
           case "playing":
                this.holdback.paint(g);
                 this.scoreIndicator.paint(g);
                break;         
           case "over":
                this.holdback.paint(g);
                this.scoreIndicator.paint(g);
                this.overScene.paint(g);
                break;
       }
       this.bird.paint(g);
      
       this.background.paintGround(g);
    },
    run:function(now){
       var dt=this.lastTime?Math.min((now-this.lastTime)/1000,this.maxDelta):0;
       this.lastTime=now;
       this.update(dt);
       this.render();
       window.requestAnimationFrame(this.run);
    }
}
    
    
})(window,document);

window.Bird=(function(window,document){
    var Constructor=function(game){
        this.game=game;
        this.maxWidth=game.canvas.width;
        this.maxHeight=game.background.skyHeight;
        this.image=R("bird");
        this.width=game.unitWidth;
        this.height=game.unitHeight;
        this.halfWidth=this.width/2;
        this.halfHeight=this.height/2;
        var frameWidth=this.image.width;
        var frameHight=this.image.height/3;
        this.frames=[{x:0,y:0,w:frameWidth,h:frameHight}
                    ,{x:0,y:frameHight,w:frameWidth,h:frameHight}
                    ,{x:0,y:frameHight*2,w:frameWidth,h:frameHight}];
        this.x=0;
        this.y=0;
        this.currentFrameIndex=0;
        //帧动画计时（秒）
        this.frameTime=0;
        this.frameInterval=0.15;
        //Y轴移动速度（像素/秒）
        this.moveY=0;
        //重力加速度（像素/秒²，原 0.3 像素/帧²）
        this.gravity=1080;
        //挥翅速度（像素/秒）
        this.flapSpeed=-360;
        //鸟的状态
        this.state=null;
        //已进入空隙的水管（通过后计分）
        this.enteredHose=null;
        //飞的声音
        this.flyAudio=R("@fly");
        //撞晕的声音
        this.buzzyAudio=R("@buzzy");
        //撞死的声音
        this.dieAudio=R("@die");
        this.reset();
    }
    Constructor.prototype.reset=function(){
        this.state="ready";
        this.x=this.game.unitWidth*2;
        this.y=(this.maxHeight-this.height)/2;
        this.enteredHose=null;
        this.moveY=0;
        this.currentFrameIndex=0;
        this.frameTime=0;
    };
    Constructor.prototype.fly=function(){
        if(this.state==="flying"){
            this.moveY=this.flapSpeed;
            this.flyAudio.replay();
        }
    };
    /**
     * 判断鸟的状态
     * 返回true表示游戏结束
     */
    Constructor.prototype.judgeState=function(){
      //是否撞击地面  
      if(this.y+this.height>=this.maxHeight){
         this.state="die";
         this.dieAudio.replay();
         return true; 
      }
      //获取障碍物
      var holdback=this.game.holdback;
      //获取当前水管空隙区域
      var spaceRect=holdback.spaceRect(this.x);
      //x方向，判断是否进入区域
      if(spaceRect.x-this.width<this.x
          &&this.x<=spaceRect.x+spaceRect.width){
            //y方向
              //是否撞到柱子
            if(this.y<=spaceRect.y
                ||this.y+this.height>=spaceRect.y+spaceRect.height){
                //装到柱子    
                this.state="dizzy";     
                this.buzzyAudio.replay();
                return true; 
            }else{
                //记录已进入的水管，通过后计分
                this.enteredHose=holdback.currentHose(this.x);
            }
      }
      //刚通过进入过空隙的水管
      if(this.enteredHose
          &&this.x>this.enteredHose.x+this.enteredHose.width){
          this.game.throughOneHose();
          this.enteredHose=null;
      }
      return false;
    };
    
    Constructor.prototype.paint=function(g){
        switch(this.state){
            case "ready":
                this.paintReady(g);
                break;
            case "flying":
                this.paintFlying(g);
                break;
            case "dizzy":
                this.paintDizzy(g);
                break;
            case "die":
                this.paintDie(g);
                break;
        }
    };
    Constructor.prototype.update=function(dt){
        //帧动画计时
        this.frameTime+=dt;
        if(this.frameTime>=this.frameInterval){
            this.frameTime-=this.frameInterval;
            if(++this.currentFrameIndex>=this.frames.length){
                this.currentFrameIndex=0;
            }
        }
        switch(this.state){
            case "flying":
                //状态判断
                if(this.judgeState()){
                    //游戏结束
                    this.game.gameOver();
                    break;
                }
                //自由落体
                this.moveY+=this.gravity*dt;
                this.y+=this.moveY*dt;
                break;
            case "dizzy":
                //晕眩后继续下落
                this.moveY+=this.gravity*dt;
                this.y+=this.moveY*dt;
                if(this.y+this.height>=this.maxHeight){
                    this.state="die";
                    this.dieAudio.replay();
                }
                break;
        }
    };
    Constructor.prototype.paintReady=function(g){
        var frame=this.frames[this.currentFrameIndex];
        g.drawImage(this.image,frame.x,frame.y,frame.w,frame.h
            ,this.x,this.y,this.width,this.height);
    }
    Constructor.prototype.paintFlying=function(g){
        var frame=this.frames[this.currentFrameIndex];
        g.save();
        //计算旋转角度
        g.translate(this.x+this.halfWidth,this.y+this.halfHeight);
        var angle=Math.atan(this.moveY/600);
        g.rotate(angle);
        g.translate(-this.x-this.halfWidth,-this.y-this.halfHeight);
        //绘制小鸟
        g.drawImage(this.image,frame.x,frame.y,frame.w,frame.h
            ,this.x,this.y,this.width,this.height);
        g.restore();
    }
    Constructor.prototype.paintDizzy=function(g){
        var frame=this.frames[this.currentFrameIndex];
        g.save();
        //计算旋转角度
        g.translate(this.x+this.halfWidth,this.y+this.halfHeight);
        var angle=Math.atan(this.moveY/600);
        g.rotate(angle);
        g.translate(-this.x-this.halfWidth,-this.y-this.halfHeight);
        //绘制小鸟
        g.drawImage(this.image,frame.x,frame.y,frame.w,frame.h
            ,this.x,this.y,this.width,this.height);
        g.restore();
    };
    Constructor.prototype.paintDie=function(g){
        var frame=this.frames[this.currentFrameIndex];
        var y=this.maxHeight-this.height+10;
        g.save();
        g.translate(this.x+this.halfWidth,y+this.halfHeight);
        g.rotate(Math.PI/2);
        g.translate(-this.x-this.halfWidth,-y-this.halfHeight);
        g.drawImage(this.image,frame.x,frame.y,frame.w,frame.h
            ,this.x,y,this.width,this.height);
        g.restore();    
    }
    return Constructor;
})(window,document);

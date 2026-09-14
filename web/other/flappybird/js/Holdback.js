/**
 * 整个屏幕宽度分为9份，鸟一份，管子2份
 * xx@$$xxx$$
 * $$@xxx$$xx
 * xx@x$$xxx$
 */
window.Holdback=(function(window,document){
    var Constructor=function(game){
            this.game=game;
            //难度基准：空隙4个高度单元、间距5个宽度单元、速度60像素/秒
            this.baseHoseSpace=game.unitHeight*4;
            this.minHoseSpace=this.baseHoseSpace*0.75;
            this.baseHoseBetween=game.unitWidth*5;
            this.minHoseBetween=this.baseHoseBetween*0.875;
            this.baseSpeed=60;
            this.maxSpeed=100;
            this.hoseSpace=this.baseHoseSpace;
            this.hoseBetween=this.baseHoseBetween;
            this.speed=this.baseSpeed;
            //水管宽度
            this.hoseWidth=game.unitWidth*2;
            //水管高度
            this.hoseHeight=game.unitHeight*10;
            //最大宽度
            this.maxWidth=game.canvas.width;
            //前水管
            this.frontHose=new Hose(this);
            //后水管
            this.behindHose=new Hose(this);
            this.reset();
    }
    Constructor.prototype.reset=function(g){
        this.applyDifficulty(0);
        this.frontHose.reset();
        this.frontHose.x=this.maxWidth;
        this.behindHose.reset();
        this.behindHose.x=this.frontHose.x+this.hoseWidth+this.hoseBetween;
    };
    //按分数提升难度：每10分一档，提速、收窄空隙、缩小间距，50分封顶
    Constructor.prototype.applyDifficulty=function(score){
        var level=Math.min(Math.floor(score/10),5);
        this.speed=Math.min(this.baseSpeed+level*8,this.maxSpeed);
        this.hoseSpace=Math.max(this.baseHoseSpace*(1-level*0.05),this.minHoseSpace);
        this.hoseBetween=Math.max(this.baseHoseBetween*(1-level*0.025),this.minHoseBetween);
    };
    //返回离鸟最近的水管（鸟已越过前水管则取后水管）
    Constructor.prototype.currentHose=function(x){
        if(x>=this.frontHose.x+this.frontHose.width){
            return this.behindHose;
        }
        return this.frontHose;
    }
    //返回x位置前的管道中间的空隙大小
    Constructor.prototype.spaceRect=function(x){
        var hose=this.currentHose(x);
        return {
          x:hose.x,
          y:hose.yDown-hose.space,
          width:this.hoseWidth,
          height:hose.space
        };
    }
    Constructor.prototype.update=function(dt){
        var a=this.frontHose;
        var b=this.behindHose;
        a.x-=this.speed*dt;
        b.x-=this.speed*dt;
        //前水管完全移出屏幕后移到队尾
        if(a.x<-a.width){
            a.reset();
            a.x=b.x+b.width+this.hoseBetween;
            this.behindHose=a;
            this.frontHose=b;
        }
    }
    Constructor.prototype.paint=function(g){
        this.frontHose.paint(g);
        this.behindHose.paint(g);
    }
    
    
    
    var Hose=function(holdback){
        this.holdback=holdback;
        this.image=R("holdback");
        //图片宽度
        this.hoseImageWidth=this.image.width/2;
        //图片高度
        this.hoseImageHeight=this.image.height;
        //中间间隙（生成时按当前难度确定）
        this.space=holdback.hoseSpace;
        //绘制宽度
        this.width=holdback.hoseWidth;
        //绘制高度
        this.height=holdback.hoseHeight;
        this.x=0;
        this.yUp=0;
        this.yDown=0;
        
    }
    Hose.prototype.reset=function(g){
        //生成时按当前难度确定空隙高度，一根管子的空隙绘制与碰撞保持一致
        this.space=this.holdback.hoseSpace;
        var maxY=this.height+this.space;
        var minY=maxY-this.height;
        this.yDown=Math.floor(Math.random()*(maxY-minY)+minY);
        this.yUp=this.yDown-this.space-this.height;
        
    }
    Hose.prototype.paint=function(g){
        var sw=this.hoseImageWidth;
        var sh=this.hoseImageHeight;
        g.drawImage(this.image,0,0,sw,sh
            ,this.x,this.yDown,this.width,this.height);
        g.drawImage(this.image,sw,0,sw,sh
            ,this.x,this.yUp,this.width,this.height);
    }
    
    
    
    
    
    
    return Constructor;
})(window,document);

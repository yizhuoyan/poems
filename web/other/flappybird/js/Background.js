window.Background=(function(window,document){
    var Constructor=function(game){
        this.game=game;
        this.sky=R("sky");
        this.ground=R("ground");
        var cvs=this.game.canvas;
        this.maxWidth=cvs.width;
        //天空高度
        this.skyHeight=game.unitHeight*14;
        this.groundHeight=cvs.height-this.skyHeight;
        this.groundY=this.skyHeight;
        this.groundX=0;
        this.skyX=0;
        //滚动速度（像素/秒）
        this.skySpeed=24;
        this.groundSpeed=60;
    }
    
    Constructor.prototype.update=function(dt){
        this.skyX-=this.skySpeed*dt;
        if(this.skyX<=-this.maxWidth){
            this.skyX+=this.maxWidth;
        }
        this.groundX-=this.groundSpeed*dt;
        if(this.groundX<=-this.maxWidth){
            this.groundX+=this.maxWidth;
        }
    }
    Constructor.prototype.paintSky=function(g){
        g.drawImage(this.sky,this.skyX,0
            ,this.maxWidth,this.skyHeight);
        g.drawImage(this.sky,this.skyX+this.maxWidth,0
            ,this.maxWidth,this.skyHeight);
    }
    Constructor.prototype.paintGround=function(g){
        g.drawImage(this.ground,this.groundX,this.groundY
            ,this.maxWidth,this.groundHeight);
        g.drawImage(this.ground,this.groundX+this.maxWidth,this.groundY
            ,this.maxWidth,this.groundHeight);
    }
    
    return Constructor;
})(window,document);

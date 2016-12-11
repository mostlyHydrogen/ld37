var game = new Phaser.Game(800, 600, Phaser.AUTO, '');

var stateMenu = {
  preload: function() {
    this.load.image('keys', 'assets/keys.png');
  },
  create: function() {
    this.add.sprite(400-64, 300-32, 'keys');
    var titleStyle = {font: '40px Arial', fill:'#aaa'};
    var title = this.add.text(64, 64, "Room With Sheep", titleStyle);

    var style = {font: '20px Arial', fill:'#aaa'};
    var description = this.add.text(64, 128, "This is the only room left in the world that's safe from the scary stuff.\nIt's scary outside; stop the silly fearless sheep from leaving.\n\nPress X to continue.", style);

    this.actionKey = this.input.keyboard.addKey(Phaser.Keyboard.X);
    this.actionKey.onDown.add(this.onDown, this);
  },
  onDown: function(button, value) {
    this.state.start('Game');
  }
};

var stateOutside = {
  preload: function() {
    this.load.image('outside', 'assets/outside.png');
  },
  create: function() {
    this.add.sprite(0, 0, 'outside');
    var style = {font: '20px Arial', fill:'#aaa'};
    var description = this.add.text(64, 128, "You are currently outside. It's weird.\n\nPress X to restart game.", style);

    var sidenoteStyle = {font: '12px Arial', fill:'#888'};
    var sidenote = this.add.text(70, 256, "(Tip: Nothing happens if you get a good score; don't waste your time)", sidenoteStyle);

    this.actionKey = this.input.keyboard.addKey(Phaser.Keyboard.X);
    this.actionKey.onDown.add(this.onDown, this);
  },
  onDown: function(button, value) {
    this.state.start('Menu');
  }
};

var padding = 50;
var roomLeft = padding + 80;
var roomRight = padding + 620;
var roomTop = padding + 80;
var roomBottom = padding + 420;
var roomWidth = 540;
var roomHeight = 340;
var doorWidth = 40;
var doorHeight = 4;

var playerSpeed = 3; //pixels per frame
var swordDuration = 200; //milliseconds
var swordCooldown = 1700;
var swordFlashTime = 90;

var Sheep = function() {
  this.sprite = game.add.sprite(400 + Math.random()*70, 300 + Math.random()*70, 'sheep');
  this.sprite.anchor.x = 0.5;
  this.sprite.anchor.y = 1;
  this.pickNewDestination(this.sprite.x, this.sprite.y);
  this.walkSpeed = 2 + Math.random() * 2;
  this.escaped = false;
};

Sheep.prototype.whack = function() {
  this.pickNewDestination(
    roomLeft + Math.random() * roomWidth,
    roomTop + Math.random() * 32
  );

  this.nextMoveTime = Date.now() + 1000 + Math.random() * 2000;
};

Sheep.prototype.update = function() {
  if (Date.now() > this.nextMoveTime) this.pickNewDestination();
  var dx = this.destinationX - this.sprite.x;
  var dy = this.destinationY - this.sprite.y;
  var distance = Math.sqrt(dx*dx + dy*dy);
  if (distance > 8) {
    var angle = Math.atan2(dy, dx);
    this.sprite.x += Math.cos(angle) * this.walkSpeed;
    this.sprite.y += Math.sin(angle) * this.walkSpeed;

    if (Math.cos(angle) > 0) this.sprite.frame = 1;
    else this.sprite.frame = 0;
  }

  if (!this.escaped) {
    if (
      this.sprite.x > roomLeft + roomWidth/2 - doorWidth/2 &&
      this.sprite.x < roomLeft + roomWidth/2 + doorWidth/2 &&
      this.sprite.y > roomBottom - doorHeight/2
    ) {
      this.sprite.alpha -= 0.05;
      if (this.sprite.alpha <= 0) {
        this.escaped = true;
        console.log('ESCAPE!!!');
      }
    }
    else {
      this.sprite.alpha = 1;
    }
  }
};

Sheep.prototype.pickNewDestination = function(x, y) {
  if (Math.random() < 0.4) {
    this.destinationX = x || roomLeft + roomWidth/2;
    this.destinationY = y || roomBottom + 32;
    this.nextMoveTime = Date.now() + 2000 + Math.random() * 8000;
  }
  else {
    this.destinationX = x || roomLeft + Math.random() * roomWidth;
    this.destinationY = y || roomTop + Math.random() * roomHeight;
    this.nextMoveTime = Date.now() + 1000 + Math.random() * 8000;
  }
};

var SwordFrame = {
  RIGHT: 0,
  LEFT: 1,
  UP: 2,
  UP_FLASH: 3
};

var DirEnum = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
var stateGame = {
  preload: function() {
    this.load.image('room', 'assets/room.png');
    this.load.spritesheet('sheep', 'assets/sheep.png', 64, 64);
    this.load.image('player', 'assets/player.png');
    this.load.spritesheet('sword', 'assets/sword.png', 32, 32);
    this.load.image('arrow', 'assets/arrow.png');
  },
  create: function() {
    var titlescreen = this.add.sprite(50, 50, 'room');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.actionKey = this.input.keyboard.addKey(Phaser.Keyboard.X);
    this.actionKey.onDown.add(this.onDown, this);

    this.sheep = [];
    for (var i = 0; i < 7; i ++) {
      var sheep = new Sheep();
      this.sheep.push(sheep);
    }

    this.arrow = this.add.sprite(roomLeft + roomWidth/2, roomBottom, 'arrow');
    this.arrow.anchor.x = 0.5; this.arrow.anchor.y = 1;
    this.arrow.exists = false;

    this.player = this.add.sprite(roomLeft + roomWidth / 2, roomBottom, 'player');
    this.player.anchor.x = 0.5;
    this.player.anchor.y = 1;
    this.playerDirection = DirEnum.LEFT;

    this.sword = this.add.sprite(0, 0, 'sword');
    this.sword.frame = SwordFrame.UP;
    this.swordAttackTime = 0; //just init

    var infoStyle = {font: '20px Arial', fill:'#f88', align:'center'};
    this.textGameover = this.add.text(roomLeft + roomWidth / 2, 140, "Only you left.\nNothing left to do but leave.", infoStyle);
    this.textGameover.x -= this.textGameover.width / 2;
    this.textGameover.exists = false;

    var timerStyle = {font: '20px Arial', fill:'#5b5', align:'center'};
    this.textTimer = this.add.text(roomLeft + roomWidth / 2, 20, "Xs remaining", timerStyle);
    this.textTimer.x -= this.textTimer.width / 2;
    this.gameStartTime = Date.now();
    this.gameEndTime = this.gameStartTime + 60 * 1000;
  },
  update: function() {
    this.sheep.forEach(function(sheep) {
      sheep.update();
    })
    this.sheep = this.sheep.filter(function(sheep) {
      return !sheep.escaped;
    });

    if (this.sheep.length == 0) {
      this.textGameover.exists = true;
      this.arrow.exists = true;
      this.textTimer.exists = false;
    }

    if (this.textTimer.exists) {
      var millisecondsRemaining = this.gameEndTime - Date.now();
      if (millisecondsRemaining > 0) {
        var secondsRemaining = Math.ceil(millisecondsRemaining / 1000);
        this.textTimer.text = secondsRemaining + 's remaining';
      }
      else {
        if (!this.scoreDetermined) {
          this.scoreDetermined = true;
          this.textTimer.text = 'Congratulations! Arbitrary time limit reached!\n\n\n\nScore: ' + this.sheep.length;
          this.textTimer.x = roomLeft + roomWidth / 2 - this.textTimer.width / 2;
        }
      }
    }

    this.handlePlayerMovement();

    var now = Date.now();
    if (now < this.swordAttackTime + swordDuration) {
      if (this.playerDirection == DirEnum.LEFT) {
        this.sword.frame = SwordFrame.LEFT;
      }
      if (this.playerDirection == DirEnum.RIGHT) {
        this.sword.frame = SwordFrame.RIGHT;
      }
      this.sword.x = this.player.x + (this.playerDirection == DirEnum.LEFT ? -44 : 12);
      this.sword.y = this.player.y - 48;

      //sword-sheep collision test
      var swordBounds = new Phaser.Rectangle(this.sword.x + 0, this.sword.y + 11, 32, 10);
      this.sheep.forEach(function(sheep) {
        if (Phaser.Rectangle.intersects(swordBounds, sheep.sprite.getBounds())) {
          sheep.whack();
        }
      })
    }
    else {
      if (now > this.swordAttackTime + swordCooldown &&
          now < this.swordAttackTime + swordCooldown + swordFlashTime) {
        this.sword.frame = SwordFrame.UP_FLASH;
      }
      else {
        this.sword.frame = SwordFrame.UP;
      }
      this.sword.x = this.player.x - (this.playerDirection == DirEnum.LEFT ? 28 : 4);
      this.sword.y = this.player.y - 60;
    }
  },
  handlePlayerMovement: function() {
    if (this.cursors.up.isDown) {
      if (this.player.y - 16 > roomTop) this.player.y -= playerSpeed;
    }

    if (this.cursors.down.isDown) {
      // this if-clause is a travesty
      if (
        this.player.y < roomBottom || (
          this.sheep.length == 0 &&
          this.player.x > roomLeft + roomWidth/2 - doorWidth/2 &&
          this.player.x < roomLeft + roomWidth/2 + doorWidth/2
        )
      ) this.player.y += playerSpeed;

      // exiting door
      if (this.player.y >= 518) {
        this.state.start('Outside');
      }
    }

    if (this.cursors.left.isDown) {
      if (this.player.x - 10 > roomLeft && this.player.y < roomBottom+2) this.player.x -= playerSpeed;
      this.playerDirection = DirEnum.LEFT;
    }

    if (this.cursors.right.isDown) {
      if (this.player.x + 10 < roomRight && this.player.y < roomBottom+2) this.player.x += playerSpeed;
      this.playerDirection = DirEnum.RIGHT;
    }
  },
  onDown: function(button, value) {
    var now = Date.now();
    if (now > this.swordAttackTime + swordCooldown) {
      this.swordAttackTime = now;
    }
  }
};


game.state.add('Menu', stateMenu);
game.state.add('Outside', stateOutside);
game.state.add('Game', stateGame);

game.state.start('Menu');

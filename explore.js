/**
 * I forgot what I was going to write here
 */

class Player // TODO
{
  pos;
  v;
  texture;
}

class Skybox // TODO
{
  time; // Basically angle of Sun
  // 30-90: night-sunrise
  // 90-150: sunrise-day
  // 150-210: day
  // 210-270: day-evening
  // 270-330: evening-night
  // 330-30: night
  
  static sunMoonWidth = 40;
  static skyMode = 1; // 0: Static sky; 1: Dynamic sky
  sunTex;
  moonTex;
  
  cloudAlphaMap;
  #cloudMapHeight;
  #cloudMapWidth;
  #cloudXScale = 1/80;
  #cloudYScale = 1/65;
  #cloudZDepth = 5;
  cloudOctaves = 4;
  cloudScale = 1;
  cloudHeight = 50;
  cloudDensity = 4;
  static cloudMode = 2; // High performance impact
  /**
   * 0: No clouds
   * 1: Static clouds
   * 2: Live clouds (low quality)
   * 3: Live clouds (high quality)
   * 4: Live clouds (insane quality)
   */
  
  static doDayNightCycle = false;
  morningColor = color( "#f5d556" ); // This has the side effect of looking like SCP-001 (When Day Breaks)
  dayColor = color( "#9ce9ff" );
  eveningColor = color( "##f55685" );
  nightColor = color( "#262b40" );
  
  constructor( sunTex, moonTex )
  {
    this.time = 0;
    
    this.sunTex = sunTex;
    this.moonTex = moonTex;
    
    this.#cloudMapWidth = w / this.cloudScale;
    this.#cloudMapHeight = h / 10 / this.cloudScale;
  }

  static _defaultSunTex()
  {
    var tex = createGraphics( this.sunMoonWidth, this.sunMoonWidth );
    
    //tex.background( 0 );
    
    var c = new Vec2( tex.width/2, tex.height/2 );
    
    for ( let x = 0; x < tex.width; x++ )
    {
      for ( let y = 0; y < tex.height; y++ )
      {
        let d = clamp(
          0, 1,
          c.subScalar( x, y ).magnitude() / (tex.width/2)
        ) ** 2;
        
        let alpha = Math.floor( smoothstep( 255, 0, d ) );
        tex.set( x, y, color( 255, 255, 120, alpha ) );
      }
    }
  
    tex.updatePixels();
    
    return tex;
  }

  static _defaultMoonTex()
  {
    var tex = createGraphics( this.sunMoonWidth, this.sunMoonWidth );
    
    var c = new Vec2( tex.width/2, tex.height/2 );
    
    for ( let x = 0; x < tex.width; x++ )
    {
      for ( let y = 0; y < tex.height; y++ )
      {
        let d = clamp(
          0, 1,
          c.subScalar( x, y ).magnitude() / (tex.width/2)
        ) ** 2;
        
        let alpha = Math.floor( smoothstep( 255, 0, 1/d ) );
        tex.set( x, y, color( 210, 210, 210, alpha ) );
      }
    }
    
    tex.updatePixels();
    
    return tex;
  }
  
  initStaticCloudMap()
  {
    tooloud.Perlin.setSeed( world.seed );
    this.cloudAlphaMap = createGraphics(
      this.#cloudMapWidth,
      this.#cloudMapHeight,
      P2D
    );
    
    this._generateLayer1Clouds();
    
    this.cloudAlphaMap.updatePixels();
  }
  
  _generateLayer1Clouds()
  {
    for ( let a = 0; a < this.#cloudMapWidth; a++ )
      {
        for ( let y = 0; y < this.#cloudMapHeight; y++ )
        {
           let x = a + (world.worldX / this.#cloudZDepth);

           let f = tooloud.Fractal.noise(
             x * this.#cloudXScale, y * this.#cloudYScale, 0, 
             this.cloudOctaves,
             tooloud.Perlin.noise
          ) * this.cloudDensity * Math.sin(
            y / this.#cloudMapHeight * PI
          );
                                           
           this.cloudAlphaMap.set(
            a, y,
            color( 255, 255 * f )
          );
        }
    }
  }
  
  _generateLayer2Clouds()
  {
    for ( let a = 0; a < this.#cloudMapWidth; a++ )
      {
        for ( let y = 0; y < this.#cloudMapHeight; y++ )
        {
           let x = a + (world.worldX / this.#cloudZDepth);

           let f = tooloud.Fractal.noise(
             x * this.#cloudXScale * 0.5,
             y * this.#cloudYScale * 0.5,
             1, 
             this.cloudOctaves,
             tooloud.Perlin.noise
          ) * this.cloudDensity * 0.5 * Math.tan(
            y / this.#cloudMapHeight * PI
          );
                                           
           this.cloudAlphaMap.set(
            a, y,
            color( 255, 255 * f )
          );
        }
      }
  }

  _generateLayer3Clouds()
  {
    
  }
  
  renderClouds( quality )
  {
    switch ( quality )
    {
      case 4:
        this._generateLayer3Clouds();
        
      case 3:
        this._generateLayer2Clouds();
        
      case 2:
        this._generateLayer1Clouds();
        break;
        
      default:
        break;
    }
    
    this.cloudAlphaMap.updatePixels();
      
    image( this.cloudAlphaMap, -halfW, -halfH + this.cloudHeight );
  }
  
  renderSunMoon()
  { 
    push();
    imageMode( CENTER );
    angleMode( DEGREES );
    translate( 0, 100 );
    rotate( this.time );
    image(
      this.sunTex,
      0, halfH,
      Skybox.sunMoonWidth, Skybox.sunMoonWidth
    );
    
    if ( this.time > 200 ) // This somehow looks good, don;t touch
      image(
        this.moonTex,
        0, -halfH,
        Skybox.sunMoonWidth, Skybox.sunMoonWidth
      );
    
    angleMode( RADIANS );
    pop();
  }

  getSkyColor()
  {
    var phase = wrap( 0, 360, (this.time - 30) ) / 60; // 0-5
    
    switch( Math.floor( phase ) )
    {
      case 0: // Night-sunrise
        return lerpColor(
          this.nightColor,
          this.morningColor,
          phase
        );
        break;
        
      case 1: // sunrise-day
        return lerpColor(
          this.morningColor,
          this.dayColor,
          phase - 1
        );
        break;
        
        case 2: // Day
        return this.dayColor;
        break;
      
      case 3: // Day-evening
        return lerpColor(
          this.dayColor,
          this.eveningColor,
          phase - 3
        );
        break;
        
      case 4: // Evening-night
        return lerpColor(
          this.eveningColor,
          this.nightColor,
          phase - 4
        );
        break;
        
      case 5: // Night
        return this.nightColor;
        break;
        
      default: // When day breaks
        return color( 255 );
        break;   
    }
  }
  
  render()
  { 
    if ( Skybox.doDayNightCycle )
    {
      background( this.getSkyColor() );
      this.renderSunMoon();
    }
    else background( this.dayColor );

    
    if ( Skybox.cloudMode > 0 )
      this.renderClouds( Skybox.cloudMode );
    
    this.time += 30 * dt;
    this.time = wrap( 0, 359, this.time );
  }
}

class Biome // Yeah I *might* have overengineered this
{
  temperature;
  noiseSmoothness;
  
  stoneOctaves;
  stoneOctaveFalloff;
  stoneMinHeight;
  stoneScale;
  
  grassOctaves;
  grassOctaveFalloff;
  grassMinHeight;
  grassScale;
  
  constructor( t, i, so, sof, smh, ss, go, gof, gmh, gs )
  {
    this.temperature = t; // 0-1. Higher temperatures make the grass "drier" (yellower), lower makes it greener
    this.noiseSmoothness = i; // The lower, the smoother
    
    this.stoneOctaves = so;
    this.stoneOctaveFalloff = sof;
    this.stoneMinHeight = smh;
    this.stoneScale = ss;
    
    this.grassOctaves = go;
    this.grassOctaveFalloff = gof;
    this.grassMinHeight = gmh;
    this.grassScale = gs;
  }
  
  applyGrassNoiseSettings()
  {
    noiseDetail( this.grassOctaves, this.grassOctaveFalloff );
  }
  
  applyStoneNoiseSettings()
  {
    noiseDetail( this.stoneOctaves, this.stoneOctaveFalloff );
  }
}

const PLAINS_BIOME = new Biome(
  0.5, 50,
  2, 0.5, 90, 30,
  4, 0.4, 20, 10
);
//const HILLS_BIOME = new Biome( 0.64, 5, 0.9 );
const OCEAN_BIOME = new Biome(
  0.2, 50,
  2, 0.3, 30, 10,
  0, 0, 0, 0
);

class Chunk // Chunk!
{
  index;
  #size;
  #biome;
  _grassHeights = [];
  _stoneHeights = [];

  constructor( index, size, biome = OCEAN_BIOME )
  {
    console.log( `Constructed chunk index ${index} of size ${size}` );
    
    // Initialise attributess
    this.index = index;
    this.#size = size;
    this.biome = biome;
    
    // Fill heightmap
    for ( let xOffset = 0; xOffset < size; xOffset++ )
    {
      this.biome.applyGrassNoiseSettings();
      this._grassHeights.push( Math.floor( noise( 
        (index * size + xOffset) / this.biome.noiseSmoothness
      ) * this.biome.grassScale ) + this.biome.grassMinHeight );
      
      this.biome.applyStoneNoiseSettings();
      this._stoneHeights.push( Math.floor( noise( 
        (index * size + xOffset ) / this.biome.noiseSmoothness
      ) * this.biome.stoneScale ) + this.biome.stoneMinHeight );
    }
    
    // Blend
    
    if ( this.index < 0 )
    {
      // Blend towards the right
      // Get last stone and grass heights of next chunk
      let targetChunk = world.chunks.get( this.index + 1 );
      
      if ( !blendChunksCheckbox.checked() && targetChunk.biome == this.biome ) return;
      
      let targetStoneHeight = targetChunk._stoneHeights[0];
      let targetGrassHeight = targetChunk._grassHeights[0];
      
      let blendStartIndex = this.#size - 2 - world.blendAmount;
                                                                                                            
      // Get the `world.blendAmount + 1`-th height from this chunk
      let startStoneHeight = this._stoneHeights[blendStartIndex];
      let startGrassHeight = this._grassHeights[blendStartIndex];
    
      // For each of the `world.blendAmount` heightpixels,
      // interpolate between `lastStoneHeight` and `targetStoneHeight`
      for ( let i = 0; i < world.blendAmount; i++ )
      {
        let index = this.#size - 1 - world.blendAmount + i;
        this._stoneHeights[index] = smoothstep(
          startStoneHeight, targetStoneHeight,
          i / world.blendAmount
        );
      
        this._grassHeights[index] = smoothstep(
          startGrassHeight, targetGrassHeight,
          i / world.blendAmount
        );
      }
    }
    else if ( this.index > 0 )
    {
      // Blend towards the left
      // Get last stone and grass heights of previous chunk
      let targetChunk = world.chunks.get( this.index - 1 );
      
      if ( !blendChunksCheckbox.checked() && targetChunk.biome == this.biome ) return;
      
      let targetStoneHeight = targetChunk._stoneHeights[this.#size - 1];
      let targetGrassHeight = targetChunk._grassHeights[this.#size - 1];
                                                        
      // Get the `world.blendAmount + 1`-th height from this chunk
      let startStoneHeight = this._stoneHeights[world.blendAmount + 1];
      let startGrassHeight = this._grassHeights[world.blendAmount + 1];
    
      // For each of the `world.blendAmount` heightpixels,
      // interpolate between `lastStoneHeight` and `targetStoneHeight`
      for ( let i = 0; i < world.blendAmount; i++ )
      {
        this._stoneHeights[i] = smoothstep(
          targetStoneHeight, startStoneHeight,
          i / world.blendAmount
        );
      
        this._grassHeights[i] = smoothstep(
          targetGrassHeight, startGrassHeight,
          i / world.blendAmount
        );
      }
    }
  }



  getGrassHeight( x )
  { 
    x = Math.floor( x % (this.#size - 1) );
    if ( x < 0 ) x = this.#size - 1 + x;
    
    return this._grassHeights[x];
  }

  getStoneHeight( x )
  {
    x = Math.floor( x % (this.#size - 1) );
    if ( x < 0 ) x = this.#size - 1 + x;
    
    return this._stoneHeights[x];
  }
}

class World
{
  #worldSize = 1000;
  #chunkSize = w;
  seed;
  
  seaLevel = 70;
  
  biomeMap = [[]];
  
  blendAmount = 30; // Blend the 5 heightpixels at the start of each chunk with the end of the previous chunk
  
  lowTempGrassColor = color( 70, 156, 94 );
  
  highTempGrassColor = color( 180, 227, 70 );

  stoneColor = color( 130 );

  worldX;
  
  chunks = new Map();

  constructor( seed )
  {
    this.seed = seed;
    noiseSeed( this.seed );
              
    // Initialise biome map
    // TODO
  

    this.worldX = -400;
              
    // Initialise starting chunk
    this.chunks.set( 0, new Chunk( 0, this.#chunkSize, PLAINS_BIOME ) );
  }

  _requestChunkGen( index )
  {   
    var chunk = new Chunk( 
      index,
      this.#chunkSize,
      random() > 0.5 ? PLAINS_BIOME : OCEAN_BIOME
    );
    
    
    
    this.chunks.set( index, chunk );
    
    return chunk;
  }

  tryGetChunk( index )
  {
    var chunk = this.chunks.get( index );
    
    if ( !chunk )
    {
      chunk = this._requestChunkGen( index );
      this.chunks.set( index, chunk )
    }
    
    return chunk;
  }

  drawSeaLevel()
  {
    push();
    fill( 52, 107, 235 );
    rect( -halfW, halfH - this.seaLevel, w, this.seaLevel);
    pop();
  }

  getGrassColor( temp )
  {
    return lerpColor( this.lowTempGrassColor, this.highTempGrassColor, temp );
  }

  render()
  {
    // Draw sea level
    this.drawSeaLevel();
    
    // Draw terrain
    for ( let x = -halfW; x <= halfW; x += lineWidth )
    {
      // What chunk is this column in?
      var chunkIndex = Math.floor( (x + halfW + this.worldX) / this.#chunkSize );
         
      // Grab the heights from the current chunk(s)   
      var chunk = this.tryGetChunk( chunkIndex );
      var stoneHeight = halfH - chunk.getStoneHeight( x + halfW + this.worldX );
      var grassHeight = chunk.getGrassHeight( x + halfW + this.worldX );
      
      // Draw the chunk
      // Stone
      push();
      stroke( this.stoneColor );
      line(
        x, halfH, // Bottom
        x, stoneHeight // Top of stone
      );
    
      // Grass
      stroke( this.getGrassColor( chunk.biome.temperature ) );
      line(
        x, stoneHeight, // Top of stone
        x, stoneHeight - grassHeight // Top of grass
      );
      pop();
    }
  }
}

// Basic
const w = 500;
const h = 500;
const halfW = w/2;
const halfH = h/2;

const moveSpeed = 10; // Px/s

var world;
var skybox;

var moonImg;

const lineWidth = 5;

var autoScrollCheckbox;
var blendChunksCheckbox;
var cloudModeSlider;
var dayNightCycleCheckbox;

var font;
function preload()
{
  font = loadFont( "fonts/Roboto-Light.ttf" );
  moonImg = loadImage( "assets/Moon.png" );
} 

function setup()
{
  // World has to be initialised here
  // because noiseSeed() can only be called within a p5js function
  world = new World( 0 );
  
  skybox = new Skybox(
    Skybox._defaultSunTex(),
    moonImg,
    1
  );
  
  // Canvas initialisation
  createCanvas( w, h, WEBGL );
  
  // Skybox initialisation
  skybox.initStaticCloudMap();
  
  strokeWeight( lineWidth );
  noStroke();
  
  textAlign( LEFT, TOP );
  textFont( font );
  textSize( 20 );
  
  autoScrollCheckbox = createCheckbox( "Auto scroll", true );
  blendChunksCheckbox = createCheckbox( "Blend chunk heights (requires regeneration)", true );
  cloudModeSlider = createSlider( 0, 3, 2, 1 );
  dayNightCycleCheckbox = createCheckbox( "Day/night cycle", false )
}

var dt;
function draw()
{
  dt = deltaTime / 1000;
  
  clear();
  Skybox.cloudMode = cloudModeSlider.value();
  Skybox.doDayNightCycle = dayNightCycleCheckbox.checked();
  skybox.render();
  
  // Render world  
  world.render();
  
  // Poll events
//  if ( keyIsDown( /* A */ 65 ) ) world.worldX -= moveSpeed * dt;
//  if ( keyIsDown( /* D */ 68 ) ) world.worldX += moveSpeed * dt;
  
  // Autoscroll
  if ( autoScrollCheckbox.checked() )
    world.worldX += Math.floor(100 * dt);
  
  // FPS monitor
  push();
  fill( 0 );
  text( `FPS: ${1/dt}\tWorldX: ${world.worldX}\nTime: ${skybox.time}`, -halfW + 1, -halfH );
  pop();
}

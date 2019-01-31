# Mechanic
A clicker game.

Agenda:
What I was planning to do
Brief demo
Challenge to solve
What I'd do next

## Brief Overview
### Game Loop
At the bottom of main.js you'll find this loop:
```javascript
    window.setInterval(function(){
        update(gc.gameobjects);
        redraw(gc.gameobjects);
    }, 12);
```
This powers the basic gameflow, every 12ms, it traverses every object in the game controller and calls each of their update() methods, followed by a loop through to call each of their redraw() methods. This allows each game object to perform some logic followed by an update on the screen. I chose 12ms based on some quick googling to get close to 60fps. This seems to be good enough.

### Saving
The game saves data in Firebase. However, at this point it's a very limited save, unfortunately, and it doesn't capture the complete game state. Because the game state is partially in the javascript objects and partially in the HTML that's rendered on the screen in the current implementation this is challenging. Rewriting this whole app in react would probably be the easiest solution!

## Things I Learned
### A method for re-triggering CSS animations
You can do all kinds of nice animations with CSS and the keyframes syntax, but they're all powered by basically applying a class to the DOM element you want to animate. This presents a problem when you want to trigger the animation repeatedly and arbitrarily. The simple solution I found with some googling was to add the class, to trigger the animation, and then add an event listener on `animationend`. See the triggerShake function in the helper.js file for an example of this.

### Using objects to represent dynamic behavior configuration
As the user progresses in the game, I gradually introduce different types of supplies to use in repair jobs. I was able to use objects containing the types of supplies needed and pass in different objects when I generate a new car object to dynamically decide which supplies would be needed. I included a reference to the actual supply object, which was useful later when I wanted to make the relevant supply UI shake on screen to indicate to the user they were out of supplies.

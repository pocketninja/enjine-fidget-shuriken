import Game from "enjine/src/js/enjine/Game";
import {addListener} from "enjine/src/js/enjine/events";
import World from "enjine/src/js/enjine/ecs/World";
import CanvasRendererSystem from "enjine/src/js/enjine/systems/CanvasRendererSystem";
import TransformComponent from "enjine/src/js/enjine/components/TransformComponent";
import ImageRendererComponent from "enjine/src/js/enjine/components/renderer-components/ImageRendererComponent";
import InputManager, {INPUT_CODES} from "enjine/src/js/enjine/managers/InputManager";
import SimpleTickSystem from "enjine/src/js/enjine/systems/SimpleTickSystem";
import CameraComponent from "enjine/src/js/enjine/components/CameraComponent";
import {lerp} from "enjine/src/js/enjine/math";


export default class FidgetShurikenGame extends Game {
    #shurikenImagePath = 'assets/images/shuriken.png';

    #world;
    #inputManager;
    #cameraComponent;
    #canvasRenderSystem;

    #dragging = false;
    #positionA = false;
    #positionB = false;
    #speed = 0;

    #shuriken;

    constructor() {
        super('FidgetShurikenGame');

        this.#world = new World;
        this.#cameraComponent = this.#world.camera.getComponent(CameraComponent);

        addListener(this, 'game.init', async event => {
            await this.#loadAssets();
            await this.#setupSystems();
            this.#setupInput();
            this.#shuriken = this.#createShuriken();
        });
    }

    async #loadAssets() {
        console.log('Loading asset/s');
        await this.resourceManager.fetchImages([this.#shurikenImagePath,]);
    }

    async #setupSystems() {
        const logGroupLabel = 'Creating/Starting systems';
        console.group(logGroupLabel);

        // Create the canvas renderer system
        const canvasRenderSystem = new CanvasRendererSystem;
        canvasRenderSystem.setCamera(this.#world.camera);
        this.#world.camera.transform.position.x = 0;
        this.#world.camera.transform.position.y = 0;

        this.#world.addSystem(canvasRenderSystem);
        this.#canvasRenderSystem = canvasRenderSystem;

        // Create the simple input system to track movement
        const simpleTickSystem = new SimpleTickSystem;
        addListener(simpleTickSystem, 'system.tick', event => this.#update(event));
        this.#world.addSystem(simpleTickSystem);

        // Start the systems
        this.#world.systems.forEach(system => system.tick());

        console.groupEnd(logGroupLabel);
    }

    #setupInput() {
        this.#inputManager = new InputManager(this.#world.getSystem(CanvasRendererSystem).canvas);
        this.#inputManager.createButton('Touch', INPUT_CODES.Mouse0);
        this.#inputManager.addButtonCallback('Touch',
            event => this.#touchBegin(event),
            event => this.#touchEnd(event),
        );
    }

    #createShuriken() {
        const transform = new TransformComponent;
        transform.position.x = 0;
        transform.position.y = 0;
        transform.scale.x = 2;
        transform.scale.y = 2;
        transform.rotation.x = 45;

        return this.#world.createNewEntity(
            transform,
            new ImageRendererComponent(this.#shurikenImagePath)
        );
    }

    #touchBegin(event) {
        this.#dragging = true;
        this.#positionA = this.#cameraComponent.getWorldCoordinatesFromViewportCoordinates(event.data.screenCoordinate);
    }

    #touchEnd(event) {
        this.#dragging = false;
    }

    #update(event) {
        if (!this.#shuriken) {
            return;
        }

        // Set the bg color based on speed
        // const colorStrength = Math.min(80, Math.abs(this.#speed)) / 80;
        // const colorValue = lerp(10, 200, colorStrength);
        // const color = `rgb(${Math.floor(colorValue)}, ${Math.floor(colorValue)}, ${Math.floor(colorValue)})`;
        // this.#canvasRenderSystem.clearFillStyle = color;

        //if not dragging, apply via speed...
        if (!this.#dragging) {
            // rotate the shuriken
            this.#shuriken.transform.rotation.x += this.#speed;
            // decay speed
            this.#speed = lerp(this.#speed, 0, 0.5 * event.data.delta);
            return;
        }

        // Get the current position
        this.#positionB = this.#cameraComponent.getWorldCoordinatesFromViewportCoordinates(
            this.#inputManager.cursorScreenPosition
        );

        // calculate the degrees from zero for position A
        const degreesA = Math.atan2(this.#positionA.y, this.#positionA.x) * 180 / Math.PI;

        // calculate the degrees from zero for position B
        const degreesB = Math.atan2(this.#positionB.y, this.#positionB.x) * 180 / Math.PI;

        this.#shuriken.transform.rotation.x += degreesA - degreesB;
        this.#speed = degreesA - degreesB;

        // dodgy check for the rotation flip
        if (this.#speed > 350) {
            this.#speed = this.#speed - 360;
        } else if (this.#speed < -350) {
            this.#speed = this.#speed + 360;
        }

        // Update the position
        this.#positionA = this.#positionB;
    }
}
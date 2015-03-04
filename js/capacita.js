var capacita = {
    analogCmds: [ "left_joy_x","left_joy_y","right_joy_x","right_joy_y"],
    analogValMap = [128,0,32,64,96,128,159,191,223,255], // 0 reset to 128, 1-9 incremental to 0 -255
    controllerMap : {
        "*": "*",
        "cross": "X",
        "circle": "O",
        "triangle": "T",
        "square": "S",
        "dpad_up": "U",
        "dpad_left": "F",
        "dpad_right": "G",
        "dpad_down": "D",
        "l1":"[",
        "l2":"{",
        "l3":"<",
        "r1":"]",
        "r2":"}",
        "r3":">",
        "select": "Z",
        "start": "Y",
        "ps": "P",
        "left_joy_x": "L",
        "left_joy_y": "l",
        "right_joy_x": "R",
        "right_joy_y": "r"
    }
};


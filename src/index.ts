import * as i2c from "i2c";
import * as ssd1306 from "./libs/ssd1306.js"

i2c.I2C1.setup({ bitrate: 400000 });
const ssd1306_display = ssd1306.connect(i2c.I2C1, 0x3C);

ssd1306_display.draw_array(ssd1306.test_image, 0, 0);
ssd1306_display.draw_string("Hello World", 0, 24);
ssd1306_display.flip();


const path = require('path');
const generate = require('../dist');

const OPTIONS = {
    src: path.join(__dirname, 'input'),
    debug: false,
    silent: true,
    verbose: false,
    dryRun: true, // does not write any file to disk
    markdown: true,
};

test('simple file should be transformed correctly', () => {
    const generatedSwaggerData = generate.main(OPTIONS);
    const expectedSwaggerData = require('./output/swagger.json');
    expect(generatedSwaggerData).toEqual(expectedSwaggerData);
});

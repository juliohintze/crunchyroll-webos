const timestamp = Date.now();

/**
 * Retrieve template as text
 * @param name
 * @returns
 */
async function getTemplate(name: string) {
    var request = await fetch(name + '?t=' + timestamp);
    var text = request.text();
    return text;
}
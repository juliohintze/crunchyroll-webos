/**
 * Retrieve template as text
 * @param name
 * @returns
 */
export async function getTemplate(name: string) {
    var request = await fetch(name);
    var text = request.text();
    return text;
}
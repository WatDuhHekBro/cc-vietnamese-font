// The sole purpose of this is to get the baseDirectory dynamically.
export default class DirInfoForVIFontExtractor extends Plugin {
	constructor(mod) {
		super(mod);
		window.modPathPrefixVIFont = mod.baseDirectory.substring(7); // "assets/mods/<name>/" to "mods/<name>"
	}
}

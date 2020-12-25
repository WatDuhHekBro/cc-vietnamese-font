// ASCII: 65 - 121
// Extended ASCII: 192 - 432
// Vietnamese Extension: 7840 - 7929
/*
AÁÀẢÃẠ aáàảãạ
ÂẤẦẨẪẬ âấầẩẫậ
ĂẮẰẲẴẶ ăắằẳẵặ
EÉÈẺẼẸ eéèẻẽẹ
ÊẾỀỂỄỆ êếềểễệ
IÍÌỈĨỊ iíìỉĩị
OÓÒỎÕỌ oóòỏõọ
ÔỐỒỔỖỘ ôốồổỗộ
ƠỚỜỞỠỢ ơớờởỡợ
UÚÙỦŨỤ uúùủũụ
ƯỨỪỬỮỰ ưứừửữự
YÝỲỶỸỴ yýỳỷỹỵ
Đđ
*/
const VIETNAMESE_CHARACTERS = "A\u00c1\u00c0\u1ea2\u00c3\u1ea0a\u00e1\u00e0\u1ea3\u00e3\u1ea1\u00c2\u1ea4\u1ea6\u1ea8\u1eaa\u1eac\u00e2\u1ea5\u1ea7\u1ea9\u1eab\u1ead\u0102\u1eae\u1eb0\u1eb2\u1eb4\u1eb6\u0103\u1eaf\u1eb1\u1eb3\u1eb5\u1eb7E\u00c9\u00c8\u1eba\u1ebc\u1eb8e\u00e9\u00e8\u1ebb\u1ebd\u1eb9\u00ca\u1ebe\u1ec0\u1ec2\u1ec4\u1ec6\u00ea\u1ebf\u1ec1\u1ec3\u1ec5\u1ec7I\u00cd\u00cc\u1ec8\u0128\u1ecai\u00ed\u00ec\u1ec9\u0129\u1ecbO\u00d3\u00d2\u1ece\u00d5\u1ecco\u00f3\u00f2\u1ecf\u00f5\u1ecd\u00d4\u1ed0\u1ed2\u1ed4\u1ed6\u1ed8\u00f4\u1ed1\u1ed3\u1ed5\u1ed7\u1ed9\u01a0\u1eda\u1edc\u1ede\u1ee0\u1ee2\u01a1\u1edb\u1edd\u1edf\u1ee1\u1ee3U\u00da\u00d9\u1ee6\u0168\u1ee4u\u00fa\u00f9\u1ee7\u0169\u1ee5\u01af\u1ee8\u1eea\u1eec\u1eee\u1ef0\u01b0\u1ee9\u1eeb\u1eed\u1eef\u1ef1Y\u00dd\u1ef2\u1ef6\u1ef8\u1ef4y\u00fd\u1ef3\u1ef7\u1ef9\u1ef5\u0110\u0111";

const PATCHED_FONT_URLS = [
	modPathPrefixVIFont + "font/hall-fetica-bold.png",
	modPathPrefixVIFont + "font/hall-fetica-small.png",
	// 7 pixels is nowhere near enough space for all the diacritics, so the "tiny" font will be rendered as a vector font instead.
];

// Add the locale and patch the base font.
localizeMe.add_locale("vi_VN", {
	language: {
		en_US: "Vietnamese",
		de_DE: "Vietnamesisch",
		fr_FR: "Vietnamien",
		ja_JP: "\u30d9\u30c8\u30ca\u30e0\u8a9e", // ベトナム語
		ko_KR: "\ubca0\ud2b8\ub0a8\uc5b4", // 베트남어
		ru_RU: "\u0412\u044c\u0435\u0442\u043d\u0430\u043c\u0441\u043a\u0438\u0439", // Вьетнамский
		vi_VN: "Ti\u1ebfng Vi\u1ec7t", // Tiếng Việt
		zh_CN: "\u8d8a\u5357\u6587", // 越南文
		zh_TW: "\u8d8a\u5357\u6587", // 越南文
	},
	from_locale: "en_US",
	// The pixel font will still be loaded, but will be overridden by the system font. However, ig.MultiFont will be modified to only apply system fonts for the "tiny" variant.
	systemFont: "CrossCode",
	async pre_patch_font(context) {
		const url = PATCHED_FONT_URLS[context.size_index];
		
		if(url)
			context.font = await waitForLoadable(new ig.Font(url, context.char_height));
	},
	patch_base_font(canvas, context) {
		const {font} = context;
		
		if(font) {
			const pen = canvas.getContext("2d");
			
			for(let i = 0; i < VIETNAMESE_CHARACTERS.length; i++) {
				const width = font.widthMap[i] + 1;
				const rect = context.reserve_char(canvas, width);
				context.set_char_pos(VIETNAMESE_CHARACTERS[i], rect);
				pen.drawImage(font.data, font.indicesX[i], font.indicesY[i], width, font.charHeight, rect.x, rect.y, rect.width, rect.height);
			}
		}
		
		return canvas;
	}
});

// Hook into ig.Lang (which is called right after ig.currentLang is set in ig.main) to know the final language and decide whether to inject into ig.MultiFont.
// Only apply these changes if the final language is vi_VN. Otherwise, other languages that use system fonts will break, such as zh_CN.
// Then modify "systemFont" in "ig.MultiFont.drawLines" and "ig.MultiFont.getCharWidth" to only activate the system font for the "tiny" variant.
// Note: The "sizeIndex" is 0, 1, and 2 for bold, small, and tiny respectively.
// The only thing that actually changed from the original code is "ig.Font.systemFont" to "(ig.Font.systemFont && this.sizeIndex === 2)" (occurring exactly twice).
ig.Lang.inject({
	init() {
		this.parent();
		
		if(ig.currentLang === "vi_VN") {
			ig.MultiFont.inject({
				drawLines(a, b, c, d, e, f) {
					var g = this.data,
						h = this.color,
						f = f != void 0 ? f : 1;
					typeof a != "string" && (a = a.toString());
					var i = null;
					if (d == ig.Font.ALIGN.RIGHT || d == ig.Font.ALIGN.CENTER) i = this.getTextDimensions(a);
					for (var j = 0, m = d == ig.Font.ALIGN.LEFT ? b : b - (d == ig.Font.ALIGN.CENTER ?
							Math.floor(i.lines[j] / 2) : i.lines[j]), k = 0, n = 0; n < a.length; n++) {
						var l = a.charCodeAt(n);
						if (l == 10) {
							j++;
							m = d == ig.Font.ALIGN.LEFT ? b : b - (d == ig.Font.ALIGN.CENTER ? Math.floor(i.lines[j] / 2) : i.lines[j]);
							c = c + (this.charHeight + f)
						}
						for (; k < e.length && e[k].index == n; ++k)
							if (e[k].command.color != void 0) {
								var o = e[k].command.color;
								if (o >= 0)
									if (o == 0 || !this.colorSets[o]) {
										g = this.data;
										h = this.color
									} else {
										g = this.colorSets[o].img.data;
										h = this.colorSets[o].color
									}
							} if (l >= ig.MultiFont.ICON_START && l < ig.MultiFont.ICON_END && this.iconSets.length >
							0) {
							l = this._getActualIndex(l - ig.MultiFont.ICON_START);
							m = m + this.iconSets[l[0]]._drawChar(l[1], m, c)
						} else m = (ig.Font.systemFont && this.sizeIndex === 2) ? m + this._drawSystemChar(l, m, c, h) : m + this._drawChar(l - this.firstChar, m, c, g)
					}
					ig.Image.drawCount = ig.Image.drawCount + a.length
				},
				getCharWidth(a) {
					if(a >= ig.MultiFont.ICON_START && a < ig.MultiFont.ICON_END && this.iconSets.length > 0) {
						a = this._getActualIndex(a - ig.MultiFont.ICON_START);
						return this.iconSets[a[0]].widthMap[a[1]] + 1 || 0
					}
					return (ig.Font.systemFont && this.sizeIndex === 2) ? this.getSystemCharWidth(String.fromCharCode(a)) :
						this.widthMap[a - this.firstChar] + 1 || 0
				},
			});
		}
	}
});

// Shamelessly stolen from... I mean, "borrowed" from crosscode-ru.
function waitForLoadable(loadable) {
	return new Promise((resolve, reject) => {
		if(loadable.loaded) {
			resolve(loadable);
			return;
		}
		
		if(loadable.failed) {
			reject(new Error(`Failed to load resource: ${loadable.path}`));
			return;
		}
		
		let loadingFinished = loadable.loadingFinished;
		
		loadable.loadingFinished = function(success) {
			try {
				loadingFinished.call(this, success);
			} catch(err) {
				reject(err);
				throw err;
			}
			
			if(success)
				resolve(loadable);
			else
				reject(new Error(`Failed to load resource: ${this.path}`));
		};
	});
}

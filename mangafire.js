const BASE_URL = "https://mangafire.to";

class MangaFire extends Source {
    constructor(cheerio) {
        super(cheerio);
    }

    get id() { return "mangafire"; }
    get name() { return "MangaFire"; }
    get icon() { return "https://mangafire.to/favicon.ico"; }
    get version() { return "1.0.0"; }
    get author() { return "Grok"; }
    get website() { return BASE_URL; }
    get language() { return "es"; }

    async getMangaList(searchTerm = "", page = 1) {
        const url = `${BASE_URL}/home`;
        const request = App.createRequest({
            url: url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const mangas = [];
        $("div.original.card-lg div.unit").each((_, element) => {
            const $el = $(element);
            const title = $el.find("div.info > a").last().text().trim();
            const id = $el.find("a.poster").attr("href")?.split("/").pop() || "";
            const image = $el.find("a.poster img").attr("src") || "";

            if (title && id) {
                mangas.push(App.createPartialSourceManga({
                    id: id,
                    title: title,
                    image: image,
                }));
            }
        });
        return mangas;
    }

    async getMangaDetails(mangaId) {
        const url = `${BASE_URL}/manga/${mangaId}`;
        const request = App.createRequest({
            url: url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const title = $('h1').first().text().trim();
        const image = $('img.cover, .cover img').attr('src') || '';
        const description = $('.description, .summary').text().trim();

        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [title],
                image: image,
                description: description,
            }),
        });
    }

    async getChapterList(mangaId) {
        const url = `${BASE_URL}/manga/${mangaId}`;
        const request = App.createRequest({
            url: url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const chapters = [];
        $("a[href*='/read/']").each((_, el) => {
            const href = $(el).attr("href") || "";
            const text = $(el).text().trim();
            const chapNum = parseFloat(text.match(/\d+\.?\d*/)?.[0] || "0");

            if (href && chapNum > 0) {
                chapters.push(App.createChapter({
                    id: href,
                    name: text,
                    chapNum: chapNum,
                }));
            }
        });
        return chapters.reverse();
    }

    async getChapter(chapterId) {
        const url = chapterId.startsWith("http") ? chapterId : `${BASE_URL}${chapterId}`;
        const request = App.createRequest({
            url: url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const pages = [];
        $("img.page-image, .chapter-page img, img[data-src]").each((_, el) => {
            let src = $(el).attr("src") || $(el).attr("data-src") || "";
            if (src && !src.startsWith("http")) src = BASE_URL + src;
            if (src) pages.push(src);
        });
        return pages;
    }
}

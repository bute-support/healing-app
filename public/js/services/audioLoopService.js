// 音源全体を Web Audio API で読み込む。
// クロスフェードや自動トリミングは行わず、
// 編集済み音源の先頭から末尾までをループ再生する。

const decodedAudioCache = new Map();

export async function loadLoopAudio(context, url) {
    if (decodedAudioCache.has(url)) {
        return decodedAudioCache.get(url);
    }

    const promise = (async () => {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`音源を読み込めません: ${response.status}`);
        }

        const data = await response.arrayBuffer();
        const buffer = await context.decodeAudioData(data);

        return {
            buffer,
            loopStart: 0,
            loopEnd: buffer.duration
        };
    })();

    decodedAudioCache.set(url, promise);

    try {
        return await promise;
    } catch (error) {
        decodedAudioCache.delete(url);
        throw error;
    }
}

// 音源全体を Web Audio API で読み込み、ループ再生用のバッファを作成する。

const decodedAudioCache = new Map();

export async function loadLoopAudio(context, url) {
    if (decodedAudioCache.has(url)) {
        return decodedAudioCache.get(url);
    }

    const promise = (async () => {
        console.log("[AudioLoop] 読み込みURL:", url);

        const response = await fetch(url);
        const data = await response.arrayBuffer();

        console.log("[AudioLoop] 読み込みデータ:", {
            status: response.status,
            ok: response.ok,
            byteLength: data.byteLength,
            url
        });

        if (data.byteLength === 0) {
            throw new Error(
                `音源データが空です: status=${response.status}, url=${url}`
            );
        }

        const buffer = await context.decodeAudioData(data);

        console.log("[AudioLoop] デコード成功:", {
            duration: buffer.duration,
            sampleRate: buffer.sampleRate,
            numberOfChannels: buffer.numberOfChannels
        });

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
        console.error("[AudioLoop] 読み込み失敗:", error);
        throw error;
    }
}

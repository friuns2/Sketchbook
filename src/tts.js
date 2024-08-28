async function synthesizeSpechify(text,voice ={  "name": "benjamin",
    "engine": "speechify",
    "languageCode": "en"}){
        const apiUrl = "https://audio.api.speechify.com/generateAudioFiles";
        const headers = {
            "accept": "*/*",
            "accept-base64": "true",
            "accept-language": "en,fi;q=0.9,ru;q=0.8,en-US;q=0.7",
            "content-type": "application/json; charset=UTF-8",
            "sec-ch-ua": "\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "x-speechify-client": "API"
        };
        const referrer = "https://onboarding.speechify.com/";
        const referrerPolicy = "strict-origin-when-cross-origin";
        const audioFormat = "mp3";
        const paragraphChunks = [text];
        const voiceParams = {
            "name": voice.name,
            "engine": voice.engine,
            "languageCode": voice.languageCode,
        };
        const requestBody = JSON.stringify({ audioFormat, paragraphChunks, voiceParams });
        const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            referrer,
            referrerPolicy,
            body: requestBody,
            mode: "cors",
            credentials: "omit"
        });
        const data = await response.json();
        return "data:audio/" + data.format + ";base64," + data.audioStream;
    }
    async function Say(text) {
        const audioData = await synthesizeSpechify(text);
        const audio = new Audio(audioData);
        audio.play();
    }
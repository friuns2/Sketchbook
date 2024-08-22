
let picker= {
    searchQuery: '',
    models: [],
    SKETCHFAB_API_URL: 'https://api.sketchfab.com/v3/search',
    SKETCHFAB_MODEL_URL: 'https://sketchfab.com/models/',
    SKETCHFAB_DOWNLOAD_URL: 'https://api.sketchfab.com/v3/models/',
    TOKEN: '6eb96d1e07b641e2b512b7cde8ee6c4d',
    onPick: null,
    async openModelPicker(searchQuery = this.searchQuery, onPick = this.onPick) {
        this.onPick = onPick;
        this.searchQuery = searchQuery;
        this.$refs.modelPickerModal.showModal();
    
        if (!this.searchQuery.trim()) return;

        try {
            const response = await fetch(`${this.SKETCHFAB_API_URL}?type=models&q=${this.searchQuery}&downloadable=true`, {
                headers: { 'Authorization': `Token ${this.TOKEN}` }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            this.models = data.results;
            this.models.forEach(model => {
                model.downloadModel = async (modelUid) => {
                    this.$refs.downloadModal.showModal();
                    try {
                        const response = await fetch(`${this.SKETCHFAB_DOWNLOAD_URL}${modelUid}/download`, {
                            headers: { 'Authorization': `Token ${this.TOKEN}` }
                        });
                        
                        if (!response.ok) throw new Error('Network response was not ok');
                        const data = await response.json();
                        const downloadUrl = data.glb?.url || data.gltf?.url;
                        if(onPick)
                            onPick(downloadUrl);
                        else
                            window.open(downloadUrl, '_blank'); // Download the model if onPick is not provided

                    } catch (error) {
                        console.error('Error downloading model:', error);
                        alert('An error occurred while trying to download the model. Please try again.');
                    } finally {
                        this.$refs.downloadModal.close();
                    }
                };
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            this.models = [];
        }
    },
    
}

picker = new Vue({
    el: '#picker',
    data: picker
});
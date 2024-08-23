
let picker= {
    searchQuery: '',
    models: [],
    
    
    
    TOKEN: '6eb96d1e07b641e2b512b7cde8ee6c4d',
    onPick: null,
    async openModelPicker(searchQuery = this.searchQuery, onPick = this.onPick) {
        this.onPick = onPick;
        this.searchQuery = searchQuery;
        this.$refs.modelPickerModal.showModal();
    
        if (!this.searchQuery.trim()) return;

        try {
            const response = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${this.searchQuery}&downloadable=true`, {
                headers: { 'Authorization': `Token ${this.TOKEN}` }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            this.models = data.results;
            this.models.sort((a, b) => b.animationCount - a.animationCount);
            this.models.forEach(model => {
                model.downloadModel = async (modelUid) => {
                    picker.$refs.modelPickerModal.close()
                    const response = await fetch(`https://api.sketchfab.com/v3/models/${modelUid}/download`, {
                        headers: { 'Authorization': `Token ${this.TOKEN}` }
                    });

                    if (!response.ok) throw new Error('Network response was not ok');
                    const data = await response.json();
                    const downloadUrl = data.glb?.url || data.gltf?.url;
                    if (onPick) {
                        onPick(downloadUrl);
                    }
                    else
                        window.open(downloadUrl, '_blank'); // Download the model if onPick is not provided
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
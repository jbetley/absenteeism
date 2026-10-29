
// Custom class for Ag Grid to change the message for empty tables
class CustomNoRowsOverlay  {
    eGui;

    init(params) {
        this.eGui = document.createElement('div');
        this.refresh(params);
    }

    getGui() {
        return this.eGui;
    }

    refresh(params) {
        this.eGui.innerHTML = `
            <div role="presentation" style="background-color: #F2F2F2;">
                <i class="nodata-msg" aria-live="polite" aria-atomic="true"> ${params.noRowsMessageFunc()} </i>
            </div>
        `;
    }
}

const smartgrid = require('smart-grid');

const settings = {
	outputStyle: 'sass',
    columns: 12,
    mobileFirst: true,
    offset: '16px',
    container: {
        maxWidth: '1180px',
        fields: '16px'
    },
    breakPoints: {
    	md: {
            width: '992px'
        },
        sm: {
            width: '767px',
            fields: '32px'
        },
        xs: {
            width: '576px',
        },
        xxs: {
            width: '386px',
            fields: '16px'
        }
    },
    oldSizeStyle: false
};

smartgrid('./src/styles', settings);
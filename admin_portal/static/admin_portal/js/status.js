/**
 * Created by Alex.Vincent on 1/9/2017.
 */
getStatusLabels = function(data) {
    switch (data) {
        case 'deleted': return '<span class = "label label-danger label-fixed-sm">Deleted</span>';
        break;
        case 'locked': return '<span class = "label label-warning label-fixed-sm">Locked</span>';
        break;
        case 'active': return '<span class = "label label-success label-fixed-sm">Active</span>';
        break;
        default: return '';
    }
};
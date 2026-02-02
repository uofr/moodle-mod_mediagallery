 //Joel Dapiawen January 26,2026
M.mod_mediagallery = M.mod_mediagallery || {};
M.mod_mediagallery.dragdrop = {

    CSS : {
        CONTAINER : '.gallery_items',
        ITEMS : '.gallery_items > .card',  
        CONTROLCONTAINER : '.controls',
        HANDLE : '.controls :first-child',  
        HANDLELINK : '.controls .move'
    },

    init : function() {
        var MOVEICON = { pix: "i/move_2d", component: 'moodle' };
        var goingUp = false, lastX = 0, lastY = 0;

        var list = Y.Node.all(this.CSS.ITEMS);
        list.each(function(card) {
            var CSS = M.mod_mediagallery.dragdrop.CSS;

            // Add move icon
            var imagenode = Y.Node.create('<img class="smallicon move action-icon" title="' + M.str.moodle.move + '"/>');
            imagenode.setAttribute('src', M.util.image_url(MOVEICON.pix, MOVEICON.component));
            imagenode.addClass('cursor');
            var handle = card.one(CSS.CONTROLCONTAINER);
            if (handle) { handle.prepend(imagenode); }

            // Make the card draggable
            var dd = new Y.DD.Drag({
                node: card,
                target: { padding: '0 0 0 20' }
            }).plug(Y.Plugin.DDProxy, { moveOnEnd: false })
              .plug(Y.Plugin.DDConstrained, { constrain2node: CSS.CONTAINER });

            // Set the handle
            if (card.one(CSS.HANDLE)) {
                dd.addHandle(card.one(CSS.HANDLE));
            }
        });

        // Drag start styling
        Y.DD.DDM.on('drag:start', function(e) {
            e.preventDefault();
            var drag = e.target;
            drag.get('node').setStyle('opacity', '.25');
            drag.get('dragNode').addClass('mod_mediagallery card');
            drag.get('dragNode').set('innerHTML', drag.get('node').get('innerHTML'));
            drag.get('dragNode').setStyles({
                opacity: '.5',
                borderColor: drag.get('node').getStyle('borderColor'),
                backgroundColor: drag.get('node').getStyle('backgroundColor')
            });
        });

        // Drag end
        Y.DD.DDM.on('drag:end', function(e) {
            var drag = e.target;
            drag.get('node').setStyles({ visibility: '', opacity: '1' });
            M.mod_mediagallery.dragdrop.save();
        });

        // Track drag direction
        Y.DD.DDM.on('drag:drag', function(e) {
            var x = e.target.lastXY[0];
            goingUp = (x < lastX);
            lastX = x;
            lastY = e.target.lastXY[1];
        });

        // Drop logic
        Y.DD.DDM.on('drop:over', function(e) {
            var drag = e.drag.get('node'),
                drop = e.drop.get('node');

            if (drop.hasClass('card')) {
                if (!goingUp) {
                    var next = drop.get('nextSibling');
                    if (next) {
                        drop = next;
                        drop.get('parentNode').insertBefore(drag, drop);
                    } else {
                        // last card, append to container
                        drop.get('parentNode').appendChild(drag);
                    }
                } else {
                    drop.get('parentNode').insertBefore(drag, drop);
                }
                e.drop.sizeShim();
            }
        });


        // Ensure drag goes into container if not over a card
        Y.DD.DDM.on('drag:drophit', function(e) {
            var drag = e.drag.get('node'),
                drop = e.drop.get('node');

            if (!drop.hasClass('card') && !drop.contains(drag)) {
                drop.appendChild(drag);
            }
        });
    },

    save : function() {
    

        var container = Y.one(this.CSS.CONTAINER);
        var cards = container.all('.card');
        var sortorder = [];

        cards.each(function(card, index) {
            var id = card.getData('id');
            if (id) {
                sortorder.push(id);
            } else {
                console.warn('Missing data-id on card', card);
            }
        });

        console.log('Final sortorder array:', sortorder);
        var params = {
            sesskey : M.cfg.sesskey,
            data : sortorder.join(','),
            "class" : 'gallery',
            m : M.mod_mediagallery.base.mid,
            id : M.mod_mediagallery.base.gallery,
            action : 'sortorder'
        };

        Y.io(M.cfg.wwwroot + '/mod/mediagallery/rest.php', {
            method: 'POST',
            data: build_querystring(params),
            on: {
                success: function(id, response) {
                    console.log(' Save success', response.responseText);
                    console.groupEnd();
                },
                failure: function(id, response) {
                    console.error(' Save failed', response);
                    console.groupEnd();
                }
            }
        });
    }


};

/**
 * Created by durupina on 12/30/16.
 * Cytoscape functions for drawing causality graphs
 */

// LOCAL FUNCTIONS

/**
 * Codes edge types by color, line type etc.
 * @param edgeType
 * @returns {{color:'', linestyle:}}
 */
function attributeMap(edgeType){
    var attributes = {color: 'gray', lineStyle: 'solid'};

    switch(edgeType){
        case "controls-state-change-of":
            attributes["color"] = "coral";
            attributes["lineStyle"]= "dashed";
            break;
        case "controls-transport-of":
            attributes["color"] = "blue";
            break;
        case "controls-phosphorylation-of":
            attributes["color"] =  "teal";
            break;
        case "controls-expression-of":
            attributes["color"] =  "deeppink";
            break;
        case "catalysis-precedes":
            attributes["color"] =  "red";
            break;
        case "in-complex-with":
            attributes["color"] =  "steelblue";
            break;
        case "interacts-with":
            attributes["color"] =  "aquamarine";
            break;
        case "neighbor-of":
            attributes["color"] =  "lime";
            break;
        case "consumption-controled-by":
            attributes["color"] =  "yellow";
            break;
        case "controls-production-of":
            attributes["color"] =  "purple";
            break;
        case "controls-transport-of-chemical":
            attributes["color"] =  "cornflowerblue";
            break;
        case "chemical-affects":
            attributes["color"] =  "darkviolet";
            break;
        case "reacts-with":
            attributes["color"] =  "deepskyblue";
            break;
        case "used-to-produce":
            attributes["color"] =  "green";
            break;
        case "upregulates-expression":
            attributes["lineStyle"]= "dashed";
            attributes["color"] =  "green";
            break;
        case "downregulates-expression":
            attributes["lineStyle"]= "dashed";
            attributes["color"] =  "red";
            break;
        case "phosphorylates":
            attributes["color"] =  "green";
            break;
        case "dephosphorylates":
            attributes["color"] =  "red";
            break;
        default:
            attributes["color"] =  'gray';
            break;
    }

    return attributes;
}


/***
 * Distribute sites around the node evenly
 */
function computeSitePositions(node){

    if(node.data("sites")) {
        var siteLength = node.data("sites").length;

        for (var i = 0; i < siteLength; i++) {
            var site = node.data("sites")[i];
            var paddingCoef = 0.9 ;

            var centerX = node.position("x");
            var centerY = node.position("y");
            var width = node.width() * paddingCoef;
            var height = node.height();
            var siteCenterX;
            var siteCenterY;

            var siteWidth = 15;
            var siteHeight = 15;

            //Draw sites at the top of the node
            if(i % 2 == 0){
                siteCenterX = centerX - width / 2 + siteWidth / 2  + width * i /siteLength ;
                siteCenterY = centerY - height /  2;

            }
            else{ //Draw sites at the bottom of the node
                siteCenterX = centerX - width / 2 + siteWidth / 2  + width * (i - 1) /siteLength ;
                siteCenterY = centerY + height /  2;

            }

            //extend site information
            node.data("sites")[i].bbox = {'x': siteCenterX, 'y': siteCenterY, 'w': siteWidth, 'h': siteHeight};

            //hack to update the bounding boxes of sites in the viewport
            node.select();
            node.unselect();
        }

    }
}



/***
 * Find the site that the user clicked and set it as selected
 * @param pos : mouse position
 * @param node : selected node
 * @returns selected site
 */
function selectAndReturnSite(pos,  node){

    if(!node.data("sites"))
        return null;

    for(var i = 0; i < node.data("sites").length; i++){
        var site = node.data("sites")[i];
        if(pos.x >= (site.bbox.x - site.bbox.w/2) && pos.x <= (site.bbox.x + site.bbox.w/2) &&
            pos.y >= (site.bbox.y - site.bbox.h/2) && pos.y <= (site.bbox.y + site.bbox.h/2)){
            site.selected = true;
            return site;
        }
    }
    return null;
}

/***
 * Unselect all sites of a node
 * @param node
 */
function unselectAllSites(node) {
    if (!node.data("sites"))
        return;

    node.data("sites").forEach(function(site){
        site.selected = false;
    });
}




/***
 * @param modelCy: Cy elements stored in the model as json objects
 * @param doTopologyGrouping
 * @returns model cy elements converted into cytoscape format with edge ids added
 */
module.exports.convertModelJsonToCyElements = function(modelCy, doTopologyGrouping){


    var nodes = [];
    var edges = [];

    for(var obj in modelCy.nodes){
        var node = modelCy.nodes[obj]
            var nodeClone = _.clone(node);
            nodes.push(nodeClone);
    };



    for(var obj in modelCy.edges){
        var edge = modelCy.edges[obj];
        var newEdge = _.clone(edge);
        //need to set this explicitly otherwise cytoscape gives a random id
        var id = edge.data.source + "-" + edge.data.target;
        newEdge.data.id = id;
        edges.push(newEdge);
    };

    var cyElements = {nodes: nodes, edges: edges};


    if(doTopologyGrouping)
        return groupTopology(cyElements);
    else
        return cyElements;

}

module.exports.runLayout = function(){
    var options =  {
        animate: false,
        fit: true,
        randomize: false,
        nodeRepulsion: 4500,
        idealEdgeLength: 50,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 5000,
        tile: true,
        tilingPaddingVertical: 5,
        tilingPaddingHorizontal: 5,
        name: 'cose-bilkent'

    };
    cy.layout(options);


}

module.exports.createContainer = function(el, doTopologyGrouping, modelManager, callback) {

    var modelCy = modelManager.getModelCy();

    var cyElements = module.exports.convertModelJsonToCyElements(modelCy, doTopologyGrouping);


    var cy = window.cy = cytoscape({
        container: el,

        boxSelectionEnabled: true,
        autounselectify: false,


        layout: {
            animate: false,
            fit: true,
            randomize: false,
            nodeRepulsion: 4500,
            idealEdgeLength: 50,
            edgeElasticity: 0.45,
            nestingFactor: 0.1,
            gravity: 0.25,
            numIter: 5000,
            tile: true,
            tilingPaddingVertical: 5,
            tilingPaddingHorizontal: 5,
            name: 'cose-bilkent'

        },

        style: CgfStyleSheet,

        elements: cyElements,

        ready: function () {


            cy.on('layoutstop', function() {
                cy.nodes().forEach(function (node) {
                    computeSitePositions(node);
                });
            });


            if(callback) callback();

            cy.on('drag', 'node', function (e) {
                computeSitePositions(this);
            });

            cy.on('select', 'node', function(e){
                this.css('background-color', '#FFCC66');

            });

            cy.on('unselect', 'node', function(e){
                //get original background color
                var backgroundColor = modelManager.getModelNodeAttribute(this.id(), 'css.backgroundColor');
                if(!backgroundColor)
                    backgroundColor = 'white';
                this.css('background-color', backgroundColor);
                unselectAllSites(this);
            });

            cy.on('tap', 'node', function(e) {

                var site = selectAndReturnSite(e.cyPosition, e.cyTarget);

                if(!site){ //node is clicked
                    if(this.data('tooltipText')) { //there is content to show
                        cy.$(('#' + this.id())).qtip({
                            content: {
                                text: function (event, api) {
                                    return this.data('tooltipText');
                                }
                            },
                            show: {
                                ready: true
                            },
                            position: {
                                my: 'center',
                                at: 'center',
                                adjust: {
                                    cyViewport: true

                                },
                                effect: false
                            },
                            style: {
                                classes: 'qtip-bootstrap',
                                tip: {
                                    corner: false,
                                    width: 20,
                                    height: 20
                                }
                            }
                        });
                    }
                }
                else if (site.siteInfo) { //site is clicked and it has information to display
                    //Adjust the positions of qtip boxes
                    var sitePosX = site.bbox.x - this.position("x");
                    var sitePosY = site.bbox.y - this.position("y");

                    var my;
                    var at;

                    if (sitePosX < 0 && sitePosY < 0) {
                        my = "bottom right";
                        at = "top left";
                    }
                    else if (sitePosX < 0 && sitePosY >= 0) {
                        my = "bottom right";
                        at = "bottom left";
                    }
                    else if (sitePosX >= 0 && sitePosY >= 0) {
                        my = "bottom left";
                        at = "bottom right";
                    }
                    else if (sitePosX >= 0 && sitePosY < 0) {
                        my = "bottom left";
                        at = "top right";
                    }

                    cy.$(('#' + this.id())).qtip({
                        content: {
                            text: function (event, api) {
                                return site.siteInfo;
                            }
                        },
                        show: {
                            ready: true
                        },
                        position: {
                            my: my,
                            at: at,
                            adjust: {
                                cyViewport: true

                            },
                            effect: false
                        },
                        style: {
                            classes: 'qtip-bootstrap',
                            tip: {
                                corner: false,
                                width: 20,
                                height: 20
                            }
                        }
                    });
                }

            });

            cy.on('tapend', 'node', function(e){
                $('.qtip').remove();
            });


            cy.on('tapend', 'edge', function (e) {

                var edge = this;

                edge.qtip({
                    content: function () {
                        return "<b style='text-align:center;font-size:16px;'>" + edge.data("edgeType") + "</b>";
                    },
                    show: {
                        ready: true
                    },
                    position: {
                        my: 'top center',
                        at: 'bottom center',
                        adjust: {
                            cyViewport: true
                        }
                    },
                    style: {
                        classes: 'qtip-bootstrap',
                        tip: {
                            width: 16,
                            height: 8
                        }
                    }
                });
            });
        }


    });


}

/***
 * Style sheet for causality graphs
 */
var CgfStyleSheet = cytoscape.stylesheet()
        .selector('node')
        .css({
            // 'border-width':'css(border-width)',
            // 'border-color': 'css(border-color)',
            //  'background-color':'white',
            'shape': 'cgfNode',
            'text-halign': 'center',
            'text-valign':'center',
            'background-color': 'white',

            'width': function(ele){
                var spacing =(ele.data('id').length +2) * 10;
                return  Math.min(200,spacing);
            },
            'height':30,
            'content': 'data(text)',

        })
        .selector('node:selected')
        .css({
            'overlay-color': 'FFCC66',
            'opacity': 1
        })
        .selector('edge')
        .css({
            'width': 'css(width)',
            'line-color': function(ele){
                return attributeMap(ele.data('edgeType')).color;

            },
            'line-style': function(ele){
                return attributeMap(ele.data('edgeType')).lineStyle;
            },
            'curve-style': 'bezier',

            'target-arrow-color': function(ele){
                return attributeMap(ele.data('edgeType')).color;
            },
            'target-arrow-shape':'triangle',
            //     function(ele) {
            //     if (ele.data('edgeType') == "in-complex-with" || ele.data('edgeType') == "interacts-with" || //nondirected
            //         ele.data('edgeType') == "neighbor-of" || ele.data('edgeType') == "reacts-with")
            //         return 'none';
            //     return 'cgfArrow';
            // },
            'arrow-size':5,
            'opacity': 0.8
        })
        .selector('edge:selected')
        .css({
            'line-color': 'black',
            'target-arrow-color': 'black',
            'source-arrow-color': 'black',
            'opacity': 1
        })

        .selector("node:parent")
        .css({
            'text-valign': 'bottom',
            'content': 'data(edgeType)', //there is a label when there's a clique among the nodes inside the compound
            'font-size': 8,


        })
        .selector("node:child")
        .css({

            'padding-top': '10px',
            'padding-bottom': '10px',
            'padding-left': '10px',
            'padding-right': '10px',


        })
    ;

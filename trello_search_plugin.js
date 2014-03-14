/*
 * This is a hackish attempt to make a better trello search.  It's slow, but it works way better.
 * TODO: Results interface that doesn't suck, leverages trello card display overlay.
 *       Only load the full card index (and build lunr_index) once the element is clicked.
 */

$(function(){
    function trl_wait(){
        if ($('.board-header-btns').length === 0){
            window.setTimeout(trl_wait,1000);
            //Give trello *plenty* of time to load
        }else{
            startup();
        }
    }

    function startup(){
        // Current location is something like:
        // https://trello.com/b/75c1kASa/galaxy-development
        // And the api download link is:
        // https://api.trello.com/1/boards/75c1kASa/cards
        var lunr_search_timeout = null;
        var urlparts = document.location.href.split('/');
        var diffurl = ["https://api.trello.com", '1', 'boards', urlparts[4], 'cards'].join('/');
        var lunr_index = lunr(function(){
            this.field('name', {boost:10});
            this.field('desc');
        });
        var search_overlay = $('<div id="lunr_search_overlay" style="display:none; position:fixed; top:0; left:0; width:100%; min-height:100%; overflow-y:scroll; background-color:#FFF;z-index:10000"><h2>Lunr Search Results (exit)</h2><div style="float:right; width:50%" id="search_overlay_detail"></div><div id="search_overlay_results">None</div></div>');
        search_overlay.on('click', function(){$(this).hide()});
        $('body').append(search_overlay);
        $('.board-header').append('<div class="board-header-btns left"><input disabled="disabled" style="height:29px; margin-bottom:0" id="trlo_lunr_search" placeholder="Building Search Index"></div>');
        $.getJSON(diffurl, function(data){
            card_dict = [];
            $.each(data, function(index, card){
                lunr_index.add(card);
                card_dict[card.id] = card;
            });
            $('#trlo_lunr_search').removeAttr('disabled').attr('placeholder', "BetterSearch...");
            $('#trlo_lunr_search').on('input', function(){
                clearTimeout(lunr_search_timeout);
                lunr_search_timeout = setTimeout(function(){
                    results = lunr_index.search($("#trlo_lunr_search").val());
                    rslts_box = $('#search_overlay_results');
                    rslts_box.html('');
                    $.each(results, function(i, result){
                        cardurl = "https://trello.com/c/" + result.ref
                        rslts_box.append('<p id="c_'+result.ref+'"><a target="_blank" href="'+cardurl+'">' + card_dict[result.ref].name + '</a></p><br>');
                        $('#c_'+result.ref).mouseover(function(){
                            $('#search_overlay_detail').html('<p>' + card_dict[result.ref].desc + '</p>');
                        });
                    });
                    search_overlay.show();
                }, 1000);
            });
        });
    }
    if (document.location.href.indexOf('https://trello.com/b/') === 0){
        trl_wait();
    }
});

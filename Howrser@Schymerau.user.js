// ==UserScript==
// @name          Horwse Tweaks
// @namespace     schymerau
// @license       MIT
// @description   For Howrse
// @author        Schymerau
// @include       */elevage/chevaux/cheval?id=*
// @include       */elevage/fiche/?id=*
// @version       1.2
// @run-at        document-start
// @noframes      true
// @resource	  IMPORTED_CSS https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css
// @require       https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require       https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @require       https://gist.github.com/Schymerau/ce30d79f767ee53c5f0d32ae2f75cbb4.js
// @require       https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js
// @require       https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.mitrue
// @require       https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
// @grant         unsafeWindow
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM.getValue
// @grant         GM.setValue
// @grant         GM_log
// @grant         GM_getResourceText
// @grant         GM_addStyle
// @updateURL
/// ==/UserScript==

(function() {
    'use strict';
    const my_css = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle();

waitForKeyElements( "#genetic-body-content", function( e )
{
   try
   {
      var skills = [ 'endurance', 'vitesse', 'dressage', 'galop', 'trot', 'saut' ];
      var rows = $( e ).find( 'tbody' ).eq( 0 ).find( 'tr' );
      var gp = parseFloat( rows.eq( 0 ).find( 'strong' ).last().text().match( /[0-9.]+/g )[ 0 ] ) || 0;
      
      for ( var i = 0; i < skills.length; i++ )
      {
         var el = rows.find( '#' + skills[ i ] + 'Genetique' );
         var p = parseFloat( el.text() ) / gp * 100;
         var span = '<span style="font-size: 0.85em; color: blue;">' + p.toFixed( 3 ) + '%</span>';
         el.parent().append( span );
      }
   }
   catch( error )
   {
      console.log( error );
   }
}, true );

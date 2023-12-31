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
// @grant         unsafeWindow
// @require            https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require       https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM.getValue
// @grant              GM.setValue
// @grant         GM_log
// @require       https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
// @updateURL     https://openuserjs.org/meta/CryptalEquine/Horse_Genetics_Revealer.meta.js
// ==/UserScript==

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
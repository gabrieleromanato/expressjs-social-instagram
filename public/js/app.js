"use strict";

$(function() {
    var $registerForm = $( "#register-form" );

    if( $registerForm.length ) {
        $registerForm.on( "submit", function( e ) {
            e.preventDefault();
            $registerForm.find( ".is-invalid" ).removeClass( "is-invalid" );
            $registerForm.find( ".invalid-feedback" ).remove();

            $.post( $registerForm.attr( "action" ), $registerForm.serialize(), function( res ) {
                if( res.errors ) {
                    res.errors.forEach(function( err ) {
                        $registerForm.find( "[name=" + err.param + "]" ).addClass( "is-invalid" ).after( '<span class="invalid-feedback" role="alert"><strong>' + err. msg + '</strong></span>' );
                    });
                } else if( res.success ) {
                    window.location = "/login/";
                } else {
                    console.log( res );
                }
            });
        });
    }

    var $loginForm = $( "#login-form" );

    if( $loginForm.length ) {
        $loginForm.on( "submit", function( e ) {
            e.preventDefault();
            $loginForm.find( ".invalid-feedback" ).remove();

            $.post( $loginForm.attr( "action" ), $loginForm.serialize(), function( res ) {
                if( !res.success ) {
                    $loginForm.append( '<span class="invalid-feedback" role="alert"><strong>Invalid login.</strong></span>' );
                } else {
                    window.location = "/profile/" + res.username;
                }
            });
        });
    }

    var $newPostForm = $( "#new-post-form" );

    if( $newPostForm.length ) {
        $newPostForm.on( "submit", function( e ) {
            e.preventDefault();
            $newPostForm.find( ".invalid-feedback" ).remove();
            $newPostForm.find( ".is-invalid" ).removeClass( "is-invalid" );

            var formData = new FormData();
            formData.append( "description", $( "#description" ).val() );
            formData.append( "image", $( "#image" )[0].files[0] );

            var settings = {
                url: $newPostForm.attr( "action" ),
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function( res ) {
                    if( res.errors ) {
                        res.errors.forEach(function( err ) {
                            $newPostForm.find( "[name=" + err.param + "]" ).addClass( "is-invalid" ).after( '<span class="invalid-feedback" role="alert"><strong>' + err. msg + '</strong></span>' );
                        });
                    } else if( res.created ) {
                        window.location = "/posts/" + res.postid;
                    } else {
                        console.log( res );
                    }
                }
            };

            $.ajax( settings );
        });
    }


    var $editForm = $( "#edit-profile-form" );

    if( $editForm.length ) {
        $editForm.on( "submit", function( e ) {
            e.preventDefault();
            

            var formData = new FormData();
            formData.append( "url", $( "#url" ).val() );
            formData.append( "description", $( "#description" ).val() );
            formData.append( "image", $( "#image" )[0].files[0] );

            var settings = {
                url: $editForm.attr( "action" ),
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function( res ) {
                    if( res.updated ) {
                        window.location = "/profile/" + res.username;
                    } else {
                        console.log( res );
                    }
                }
            };

            $.ajax( settings );
        });
    }

    var $followBtn = $( "#follow-btn" );

    if( $followBtn.length ) {
        $followBtn.click(function() {
            var data = {
                follower: $followBtn.data( "follower" ),
                following: $followBtn.data( "following" ),
                action: $followBtn.data( "action" )
            };

            $.post( "/follow", data, function( res ) {
              if( res.done ) {  
                var text = $followBtn.data( "action" ) === "follow" ? "Unfollow" : "Follow";
                var count = parseInt( $( "#followers" ).text(), 10 );

                if( text === "Unfollow" ) {
                    $( "#followers" ).text( count + 1 );
                    $followBtn.data( "action", "unfollow" ).text( text );
                } else {
                    $( "#followers" ).text( count - 1 ); 
                    $followBtn.data( "action", "follow" ).text( text );
                }
              }  
            });
        });
    }
});
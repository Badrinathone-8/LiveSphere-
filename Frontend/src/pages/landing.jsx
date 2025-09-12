import React from 'react'
import '../App.css';
import {Link} from "react-router-dom"
export default function landing() {
    return (
        <>
            <div className="landingPageContainer" >
                <nav>
                    <div className='vedio'>
                        <h2>SphereLive Call</h2>
                    </div>
                    <div className='join'>
                       <Link to={'/url'}> <p>join as a Guest</p></Link>
                        <Link to={"/auth"}><p>Register</p></Link>
                        <button className='login'>
                           <Link to={"/auth"}> <p>Login</p></Link>
                        </button>

                    </div>
                </nav>
                <div className='hero'>
                    <div className='connect'>
                        <h1 ><span style={{ color: "rgb(244, 137, 6)" }}>Connect</span> with your loved once</h1>

                        <h3>Cover your distance with us</h3>
                        <Link to={"/auth"}>
                            <button>Get Started</button>
                        </Link>
                    </div>
                    <img src="/image.png"></img>
                </div>
            </div>

        </>
    )
}

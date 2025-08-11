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
                        <p>join as a Guest</p>
                        <p>Register</p>
                        <button className='login'>
                            <p>Login</p>
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
